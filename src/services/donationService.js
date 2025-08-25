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

const getDonations = async (query) => {
    // Parsing pagination
    const page = parseInt(query.page) > 0 ? parseInt(query.page) : 1;
    const size = parseInt(query.size) > 0 ? parseInt(query.size) : 10;
    const skip = (page - 1) * size;

    // Parsing filter
    let categoryIds = undefined;
    if (query.category) {
        categoryIds = query.category.split(',').map(Number).filter(Boolean);
    }
    let statuses = undefined;
    if (query.status) {
        statuses = query.status.split(',').map(status => status.trim()).filter(Boolean);
    }

    // Build where clause
    const where = {};
    if (categoryIds && categoryIds.length > 0) {
        where.category_id = { in: categoryIds };
    }
    if (statuses && statuses.length > 0) {
        // Cari donation yang status terakhirnya ada di status filter
        where.donationStatusHistories = {
            some: {
                status: { in: statuses }
            }
        };
    }

    // Get total count
    const total = await prismaClient.donation.count({ where });

    // Get data
    const donations = await prismaClient.donation.findMany({
        where: where,
        skip: skip,
        take: size,
        // orderBy: { updated_at: "desc" },
        include: {
            images: true,
            category: true,
            donationStatusHistories: {
                orderBy: { created_at: "desc" },
                take: 1 //take last status
            }
        }
    });

    // Mapping response
    const data = donations.map(donation => ({
        id: donation.id,
        item_name: donation.item_name,
        description: donation.description,
        images: donation.images.map(img => {
            if (!img.image_path.startsWith("http") || !img.image_path.startsWith("https")) {
                return getPictureUrl(query.req, img.image_path);
            }
            return img.image_path
        }),
        category: donation.category ? { id: donation.category.id, name: donation.category.name } : null,
        status: donation.donationStatusHistories[0]?.status || null,
        updated_at: donation.updated_at,
    }));

    return {
        meta: {
            total: total,
            page: page,
            size: size,
            totalPages: Math.ceil(total / size),
        },
        data: data
    };
}

export default { createDonation, getDonations };