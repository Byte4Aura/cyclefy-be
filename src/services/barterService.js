import { validate } from "../validations/validation.js";
import { createBarterValidation } from "../validations/barterValidation.js";
import { addressIdOwnershipValidate, phoneIdOwnershipValidate, isCategoryIdValid } from "../helpers/userHelper.js";
import { prismaClient } from "../application/database.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { ResponseError } from "../errors/responseError.js";
import { calculateDistance } from "../helpers/geoHelper.js";

const getBarters = async (userId, search, category, maxDistance, sort, page, size, reqObject) => {
    // Get all current user addresses
    const userAddresses = await prismaClient.address.findMany({
        where: { user_id: userId }
    });
    if (!userAddresses.length) throw new ResponseError(404, "user.no_address");

    // Get Other user barter posts query
    const where = {
        user_id: { not: userId }
    };
    if (category && category.length > 0) {
        where.category = { name: { in: category } };
    }
    if (search) {
        where.OR = [
            { item_name: { contains: search } },
            { description: { contains: search } },
            // { category: { name: { contains: search} } }
        ];
    }

    // Get other user barter posts
    const skip = (page - 1) * size;
    const barters = await prismaClient.barter.findMany({
        where: where,
        skip: skip,
        take: size,
        include: {
            address: true,
            category: true,
            user: true
        }
    });

    // Count minimun distance to all current user addresses
    const data = barters.map(barter => {
        const distances = userAddresses.map(address => {
            const start = { latitude: address.latitude, longitude: address.longitude }
            const end = { latitude: barter.address.latitude, longitude: barter.address.longitude }
            return calculateDistance(start, end);
        });
        const minDistance = Math.min(...distances);
        return {
            id: barter.id,
            item_name: barter.item_name,
            description: barter.description,
            category: {
                id: barter.category.id,
                name: barter.category.name,
            },
            address: {
                id: barter.address.id,
                address: barter.address.address,
                latitude: barter.address.latitude,
                longitude: barter.address.longitude
            },
            distance: minDistance,
            user: {
                id: barter.user.id,
                username: barter.user.username,
                fullname: barter.user.fullname,
                profile_picture: getPictureUrl(reqObject, barter.user.profile_picture)
            },
            created_at: barter.created_at,
            updated_at: barter.updated_at
        }
    });

    let filtered = data;
    // Filter data by maxDistance if exists
    if (maxDistance && typeof maxDistance === 'number') {
        filtered = data.filter(item => item.distance <= maxDistance);
    }
    // Sorting data
    if (sort === "nearest") {
        filtered.sort((a, b) => a.distance - b.distance);
    } else if (sort === "newest") {
        // filtered.sort((a, b) => b.id - a.id);
        filtered.sort((a, b) => b.created_at - a.created_at);
    } //sort by relevance = default sort

    // Pagination meta
    // const total = await prismaClient.barter.count({ where: where });
    const total = filtered.length;

    return {
        meta: {
            total: total,
            page: page,
            size: size,
            totalPages: Math.ceil(total / size)
        },
        data: filtered
    }
}

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
    getBarters,
    createBarter,
}