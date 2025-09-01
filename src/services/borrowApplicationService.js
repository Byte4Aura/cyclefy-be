import { prismaClient } from "../application/database.js";
import { addressIdOwnershipValidate, phoneIdOwnershipValidate } from "../helpers/userHelper.js";
import { validate } from "../validations/validation.js";
import { createBorrowApplicationValidation } from "../validations/borrowApplicationValidation.js";
import { ResponseError } from "../errors/responseError.js";

const createBorrowApplication = async (userId, borrowId, requestBody, reqObject) => {
    // 1. Validasi borrowId
    const borrow = await prismaClient.borrow.findUnique({
        where: { id: borrowId },
        include: { borrowStatusHistories: { orderBy: { created_at: "desc" }, take: 1 } }
    });
    if (!borrow) throw new ResponseError(404, "borrow.not_found");
    if (borrow.user_id === userId) throw new ResponseError(403, "borrow_application.cannot_request_own_post");

    // 2. Validasi input
    const data = validate(createBorrowApplicationValidation, requestBody, reqObject);

    // 3. Validasi address & phone milik user login
    await addressIdOwnershipValidate(userId, data.address_id);
    await phoneIdOwnershipValidate(userId, data.phone_id);

    // 4. Validasi duration
    const reqFrom = new Date(data.duration_from);
    const reqTo = new Date(data.duration_to);
    if (
        reqFrom < borrow.duration_from ||
        reqTo > borrow.duration_to ||
        reqFrom >= reqTo
    ) {
        throw new ResponseError(400, "borrow_application.invalid_duration");
    }

    // 5. Cek duplicate/overlap request aktif
    // const activeStatuses = ["request_submitted", "confirmed", "borrowed", "lent", "overdue"];
    // const existing = await prismaClient.borrowApplication.findFirst({
    //     where: {
    //         borrow_id: borrowId,
    //         user_id: userId,
    //         OR: [
    //             {
    //                 duration_from: { lte: reqTo },
    //                 duration_to: { gte: reqFrom }
    //             }
    //         ],
    //         borrowApplicationStatusHistories: {
    //             some: { status: { in: activeStatuses } }
    //         }
    //     }
    // });
    // if (existing) throw new ResponseError(409, "borrow_application.duplicate_active_request");

    // 6. Buat borrow application
    const borrowApp = await prismaClient.borrowApplication.create({
        data: {
            borrow_id: borrowId,
            user_id: userId,
            reason: data.reason,
            address_id: data.address_id,
            phone_id: data.phone_id,
            duration_from: reqFrom,
            duration_to: reqTo
        }
    });

    // 7. Buat status history
    await prismaClient.borrowApplicationStatusHistory.create({
        data: {
            borrow_application_id: borrowApp.id,
            status: "request_submitted",
            status_detail: "borrow_application.request_submitted_detail"
        }
    });

    // 8. Update status borrow jika status terakhir waiting_for_request
    const lastStatus = borrow.borrowStatusHistories[0];
    if (lastStatus && lastStatus.status === "waiting_for_request") {
        await prismaClient.borrowStatusHistory.create({
            data: {
                borrow_id: borrowId,
                status: "waiting_for_confirmation",
                status_detail: "borrow.posting.waiting_for_confirmation_detail"
            }
        });
    }

    // 9. Response
    return {
        id: borrowApp.id,
        borrow_id: borrowId,
        reason: borrowApp.reason,
        address_id: borrowApp.address_id,
        phone_id: borrowApp.phone_id,
        duration_from: borrowApp.duration_from,
        duration_to: borrowApp.duration_to,
        status: "Request Submitted"
    };
};

export default {
    createBorrowApplication
}