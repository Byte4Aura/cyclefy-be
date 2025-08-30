import { validate } from "../validations/validation.js";
import { createBarterApplicationValidation } from "../validations/barterApplicationValidation.js";
import { addressIdOwnershipValidate, phoneIdOwnershipValidate, isCategoryIdValid } from "../helpers/userHelper.js";
import { prismaClient } from "../application/database.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { ResponseError } from "../errors/responseError.js";
import { snakeToTitleCase } from "../helpers/statusHelper.js";

const createBarterApplication = async (userId, barterId, requestBody, files, reqObject) => {
    // Validate barterId (must be other users' post)
    const barter = await prismaClient.barter.findUnique({
        where: { id: barterId }
    });
    if (!barter || barter.user_id === userId) throw new ResponseError(404, "barter.not_found");

    let applicationData, imagePaths = [], imagesToInsert = [];

    // First option: Use existing item
    if (requestBody.use_existing_barter_id) {
        const userBarterId = Number(requestBody.use_existing_barter_id);
        if (!Number.isInteger(userBarterId) || Number.isNaN(userBarterId)) throw new ResponseError(404, "barter_application.user_barter_id_invalid");
        // Validate ownership
        const userBarter = await prismaClient.barter.findUnique({
            where: { id: userBarterId, user_id: userId },
            include: {
                images: true,
                barterStatusHistories: {
                    orderBy: { created_at: "desc" },
                    take: 1  //take last status
                }
            }
        });
        if (!userBarter) throw new ResponseError(404, "barter_application.user_barter_not_found");
        if (userBarter.barterStatusHistories[0].status !== "waiting_for_confirmation" &&
            userBarter.barterStatusHistories[0].status !== "waiting_for_request"
        ) throw new ResponseError(400, "barter.status_not_available");

        // Check duplicate
        const duplicate = await prismaClient.barterApplication.findFirst({
            where: {
                barter_id: barterId,
                user_id: userId,
                item_name: userBarter.item_name
            }
        });
        if (duplicate) throw new ResponseError(409, "barter_application.duplicate_existing_item");

        applicationData = {
            barter_id: barterId,
            user_id: userId,
            item_name: userBarter.item_name,
            description: userBarter.description,
            category_id: userBarter.category_id,
            address_id: userBarter.address_id,
            phone_id: userBarter.phone_id,
            // decline_reason: ""
        };

        // Siapkan data gambar untuk insert setelah barterApplication dibuat
        imagesToInsert = userBarter.images.map(image => ({
            image_path: image.image_path,
            image_name: image.image_name,
            image_size: image.image_size
        }));
        imagePaths = imagesToInsert.map(img => getPictureUrl(reqObject, img.image_path));
    } else {
        const data = validate(createBarterApplicationValidation, requestBody, reqObject);
        if (!files || !Array.isArray(files) || files.length === 0)
            throw new ResponseError(400, "file.no_file_uploaded", {
                images: null
            });
        // if (files.length > 5)
        //     throw new ResponseError(400, "file.too_many_files");

        // Second option: manual
        await addressIdOwnershipValidate(userId, data.address_id);
        await phoneIdOwnershipValidate(userId, data.phone_id);
        await isCategoryIdValid(data.category_id);

        applicationData = {
            barter_id: barterId,
            user_id: userId,
            item_name: data.item_name,
            description: data.description,
            category_id: data.category_id,
            address_id: data.address_id,
            phone_id: data.phone_id,
            // decline_reason: ""
        };

        // Siapkan data gambar upload untuk insert setelah barterApplication dibuat
        imagesToInsert = (files || []).map(file => ({
            image_path: `/assets/barters/applications/${file.filename}`,
            image_name: file.originalname,
            image_size: file.size
        }));
        imagePaths = imagesToInsert.map(img => getPictureUrl(reqObject, img.image_path));
    }

    // Create Barter Application
    const barterApplication = await prismaClient.barterApplication.create({
        data: applicationData
    });

    // Insert semua gambar dengan barter_application_id yang sudah pasti
    if (imagesToInsert.length > 0) {
        await prismaClient.barterApplicationImage.createMany({
            data: imagesToInsert.map(img => ({
                ...img,
                barter_application_id: barterApplication.id
            }))
        });
    }

    // Create barter application status
    await prismaClient.barterApplicationStatusHistory.create({
        data: {
            barter_application_id: barterApplication.id,
            status: "request_submitted",
            status_detail: "barter_application.request_submitted_detail",
            // updated_by: userId
        }
    });

    // Update barter status
    const latestBarterStatus = await prismaClient.barterStatusHistory.findFirst({
        where: { barter_id: barterId },
        orderBy: { created_at: "desc" }
    });
    if (latestBarterStatus && latestBarterStatus.status === "waiting_for_request") {
        await prismaClient.barterStatusHistory.create({
            data: {
                barter_id: barterId,
                status: "waiting_for_confirmation",
                status_detail: "barter.posting.waiting_for_confirmation_detail",
                // updated_by: userId
            }
        });
    }

    return {
        id: barterApplication.id,
        barter_id: barterId,
        item_name: barterApplication.item_name,
        description: barterApplication.description,
        category_id: barterApplication.category_id,
        address_id: barterApplication.address_id,
        phone_id: barterApplication.phone_id,
        images: imagePaths,
        status: snakeToTitleCase("request_submitted")
    };
};

export default { createBarterApplication };