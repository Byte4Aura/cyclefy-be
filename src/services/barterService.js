import { validate } from "../validations/validation.js";
import { createBarterValidation } from "../validations/barterValidation.js";
import { addressIdOwnershipValidate, phoneIdOwnershipValidate, isCategoryIdValid } from "../helpers/userHelper.js";
import { prismaClient } from "../application/database.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { ResponseError } from "../errors/responseError.js";

const createBarter = async (userId, requestBody, files, reqObject) => {
    if (!files || !Array.isArray(files) || files.length === 0)
        throw new ResponseError(400, "file.no_file_uploaded");
    // if (files.length > 5)
    //     throw new ResponseError(400, "file.too_many_files");

    const data = validate(createBarterValidation, requestBody, reqObject);

    // Ownership & validation
    await addressIdOwnershipValidate(userId, data.address_id);
    await phoneIdOwnershipValidate(userId, data.phone_id);
    await isCategoryIdValid(data.category_id);

    // Save barter
    const barter = await prismaClient.barter.create({
        data: {
            user_id: userId,
            item_name: data.item_name,
            description: data.description,
            category_id: data.category_id,
            address_id: data.address_id,
            phone_id: data.phone_id,
        },
        include: { category: true }
    });

    // Save all images
    const imagePaths = [];
    for (const file of files) {
        const imagePath = `/assets/barters/postings/${file.filename}`;
        await prismaClient.barterImage.create({
            data: {
                barter_id: barter.id,
                // image_path: file.path.replace(/\\/g, "/"),
                image_path: imagePath,
                image_name: file.originalname,
                image_size: file.size
            }
        });
        imagePaths.push(getPictureUrl(reqObject, imagePath));
    }

    // Create Barter Status
    const barterStatus = await prismaClient.barterStatusHistory.create({
        data: {
            barter_id: barter.id,
            status: "waiting_for_request",
            status_detail: "barter.posting.waiting_for_request_detail",
            updated_by: userId
        }
    });

    return {
        id: barter.id,
        item_name: barter.item_name,
        description: barter.description,
        category: {
            id: barter.category.id,
            name: barter.category.name
        },
        address_id: barter.address_id,
        phone_id: barter.phone_id,
        images: imagePaths,
        status: barterStatus.status
    };
};

export default {
    createBarter
}