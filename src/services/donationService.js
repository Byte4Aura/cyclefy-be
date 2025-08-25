import { prismaClient } from "../application/database.js";
import { createDonationValidation } from "../validations/donationValidation.js";
import { validate } from "../validations/validation.js";
import { ResponseError } from "../errors/responseError.js";
import path from "path";
import fs from "fs/promises";
import { addressIdOwnershipValidate, isCategoryIdValid, phoneIdOwnershipValidate } from "../helpers/userHelper.js";
import { getPictureUrl } from "../helpers/fileHelper.js";

const createDonation = async (userId, requestBody, files, reqObject) => {
    if (!files || !Array.isArray(files) || files.length === 0)
        throw new ResponseError(400, "file.no_file_uploaded");
    // if (files.length > 5)
    //     throw new ResponseError(400, "file.too_many_files");

    const data = validate(createDonationValidation, requestBody, reqObject);

    // Make sure the address and phone is owned by userId (ownership checking)
    await addressIdOwnershipValidate(userId, data.address_id);
    await phoneIdOwnershipValidate(userId, data.phone_id);
    await isCategoryIdValid(data.category_id);

    // Save donation
    const donation = await prismaClient.donation.create({
        data: {
            user_id: userId,
            item_name: data.item_name,
            description: data.description,
            category_id: data.category_id,
            address_id: data.address_id,
            phone_id: data.phone_id,
        },
        include: {
            category: true
        }
    });

    // Save all images
    const imagePaths = [];
    for (const file of files) {
        const imagePath = `/assets/donations/offers/${file.filename}`;
        await prismaClient.donationImage.create({
            data: {
                donation_id: donation.id,
                image_path: imagePath,
                image_name: file.originalname,
                image_size: file.size
            }
        });
        imagePaths.push(getPictureUrl(reqObject, imagePath));
    }

    // Create Donation Status
    const donationStatus = await prismaClient.donationStatusHistory.create({
        data: {
            donation_id: donation.id,
            status: "submitted",
            status_detail: "donation.submitted_detail",
            updated_by: userId
        }
    });

    return {
        id: donation.id,
        item_name: donation.item_name,
        description: donation.description,
        category: {
            id: donation.category.id,
            name: donation.category.name
        },
        address_id: donation.address_id,
        phone_id: donation.phone_id,
        image: imagePaths,
        status: donationStatus.status
    };
};

export default { createDonation };