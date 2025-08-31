import { prismaClient } from "../application/database.js";
import { addressIdOwnershipValidate, phoneIdOwnershipValidate, isCategoryIdValid } from "../helpers/userHelper.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { validate } from "../validations/validation.js";
import { createBorrowValidation } from "../validations/borrowValidation.js";
import { ResponseError } from "../errors/responseError.js";
import { snakeToTitleCase } from "../helpers/statusHelper.js";

const createBorrow = async (userId, requestBody, files, reqObject) => {
    if (!files || !Array.isArray(files) || files.length === 0)
        throw new ResponseError(400, "file.no_file_uploaded");
    // if (files.length > 5)
    //     throw new ResponseError(400, "file.too_many_files");

    const data = validate(createBorrowValidation, requestBody, reqObject);

    // Ownership & validation
    await addressIdOwnershipValidate(userId, data.address_id);
    await phoneIdOwnershipValidate(userId, data.phone_id);
    await isCategoryIdValid(data.category_id);

    // Save borrow
    const borrow = await prismaClient.borrow.create({
        data: {
            user_id: userId,
            item_name: data.item_name,
            description: data.description,
            category_id: data.category_id,
            address_id: data.address_id,
            phone_id: data.phone_id,
            duration_from: new Date(data.duration_from),
            duration_to: new Date(data.duration_to)
        },
        include: { category: true }
    });

    // Save all images
    const imagePaths = [];
    if (files && Array.isArray(files)) {
        for (const file of files) {
            await prismaClient.borrowImage.create({
                data: {
                    borrow_id: borrow.id,
                    image_path: `/assets/borrows/postings/${file.filename}`,
                    image_name: file.originalname,
                    image_size: file.size
                }
            });
            imagePaths.push(getPictureUrl(reqObject, `/assets/borrows/postings/${file.filename}`));
        }
    }

    // Create Borrow Status
    const borrowStatus = await prismaClient.borrowStatusHistory.create({
        data: {
            borrow_id: borrow.id,
            status: "waiting_for_request",
            status_detail: reqObject.__("borrow.posting.waiting_for_request_detail"),
        }
    });

    return {
        id: borrow.id,
        item_name: borrow.item_name,
        description: borrow.description,
        category: {
            id: borrow.category.id,
            name: borrow.category.name
        },
        address_id: borrow.address_id,
        phone_id: borrow.phone_id,
        duration_from: borrow.duration_from,
        duration_to: borrow.duration_to,
        images: imagePaths,
        status: snakeToTitleCase(borrowStatus.status)
    };
};

export default {
    createBorrow,
};