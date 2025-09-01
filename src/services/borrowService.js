import { prismaClient } from "../application/database.js";
import { addressIdOwnershipValidate, phoneIdOwnershipValidate, isCategoryIdValid } from "../helpers/userHelper.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { validate } from "../validations/validation.js";
import { createBorrowValidation } from "../validations/borrowValidation.js";
import { ResponseError } from "../errors/responseError.js";
import { snakeToTitleCase } from "../helpers/statusHelper.js";
import { calculateDistance } from "../helpers/geoHelper.js";

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

const getBorrows = async (
    userId, search, category, maxDistance, location, from, to, days, sort, page, size, reqObject
) => {
    // 1. Get all user addresses
    const userAddresses = await prismaClient.address.findMany({ where: { user_id: userId } });
    if (!userAddresses.length) throw new ResponseError(404, "user.no_address");

    // 2. Build where clause
    const where = { user_id: { not: userId } };
    if (category && category.length > 0) {
        where.category = { name: { in: category } };
    }
    if (search) {
        where.OR = [
            { item_name: { contains: search } },
            { description: { contains: search } }
        ];
    }
    // Location filter (city/state/country)
    if (!maxDistance && location) {
        where.OR = [
            ...(where.OR || []),
            { address: { address: { contains: location } } },
        ];
    }

    // 3. Query all borrows
    const borrows = await prismaClient.borrow.findMany({
        where,
        include: {
            address: true,
            category: true,
            user: true,
            borrowStatusHistories: {
                orderBy: { created_at: "desc" },
                take: 1  //take last status
            },
            images: true
        }
    });

    // 4. Filter status
    const allowedStatuses = ["waiting_for_request", "waiting_for_confirmation"];
    let filtered = borrows.filter(borrow =>
        borrow.borrowStatusHistories.length > 0 &&
        allowedStatuses.includes(borrow.borrowStatusHistories[0].status)
    );

    // 5. Filter by maxDistance (if set)
    let data = filtered.map(borrow => {
        const distances = userAddresses.map(address => {
            const start = { latitude: address.latitude, longitude: address.longitude };
            const end = { latitude: borrow.address.latitude, longitude: borrow.address.longitude };
            return calculateDistance(start, end);
        });
        const minDistance = Math.min(...distances);
        return {
            ...borrow,
            minDistance
        };
    });
    if (maxDistance && typeof maxDistance === 'number' && !isNaN(maxDistance)) {
        data = data.filter(item => item.minDistance <= maxDistance);
    }

    // 6. Filter by duration
    if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        data = data.filter(item =>
            item.duration_from <= fromDate && item.duration_to >= toDate
        );
    } else if (days && typeof days === 'number' && !isNaN(days)) {
        data = data.filter(item => {
            const duration = (item.duration_to - item.duration_from) / (1000 * 60 * 60 * 24);
            return duration >= days;
        });
    }

    // 7. Mapping final response
    const mapped = data.map(borrow => ({
        id: borrow.id,
        item_name: borrow.item_name,
        description: borrow.description,
        category: {
            id: borrow.category.id,
            name: borrow.category.name,
        },
        address: {
            id: borrow.address.id,
            address: borrow.address.address,
            latitude: borrow.address.latitude,
            longitude: borrow.address.longitude
        },
        distance: borrow.minDistance,
        user: {
            id: borrow.user.id,
            username: borrow.user.username,
            fullname: borrow.user.fullname,
            profile_picture: (!borrow.user.profile_picture?.startsWith("http") && !borrow.user.profile_picture?.startsWith("https"))
                ? getPictureUrl(reqObject, borrow.user.profile_picture)
                : borrow.user.profile_picture,
        },
        images: borrow.images.map(img =>
            (!img.image_path.startsWith("http") && !img.image_path.startsWith("https"))
                ? getPictureUrl(reqObject, img.image_path)
                : img.image_path
        ),
        duration_from: borrow.duration_from,
        duration_to: borrow.duration_to,
        borrowing_duration: (borrow.duration_to - borrow.duration_from) / (1000 * 60 * 60 * 24),
    }));

    // 8. Sorting
    if (sort === "nearest") {
        mapped.sort((a, b) => a.distance - b.distance);
    } else if (sort === "newest") {
        mapped.sort((a, b) => b.created_at - a.created_at);
    } else if (sort === "borrowing_duration") {
        mapped.sort((a, b) => b.borrowing_duration - a.borrowing_duration);
    } // default: relevance

    // 9. Pagination
    const total = mapped.length;
    const paged = mapped.slice((page - 1) * size, page * size);

    return {
        meta: {
            total: total,
            page: page,
            size: size,
            totalPages: Math.ceil(total / size)
        },
        data: paged
    };
};

const getBorrowDetail = async (userId, borrowId, reqObject) => {
    // 1. Ambil data borrow beserta relasi
    const borrow = await prismaClient.borrow.findUnique({
        where: { id: borrowId, user_id: { not: userId } },
        include: {
            address: true,
            category: true,
            user: true,
            phone: true,
            borrowStatusHistories: {
                orderBy: { created_at: "desc" },
                take: 1  //take last status
            },
            images: true
        }
    });
    if (!borrow) throw new ResponseError(404, "borrow.not_found");

    // if (borrow.user_id === userId) throw new ResponseError(403, "borrow.forbidden_own_post");

    // 2. Ambil status terakhir
    const statusHistory = borrow.borrowStatusHistories[0] ?? null;

    // 3. Hitung distance (ambil alamat user login, cari yang terdekat)
    const userAddresses = await prismaClient.address.findMany({ where: { user_id: userId } });
    let distance = null;
    if (userAddresses.length > 0) {
        const distances = userAddresses.map(address => {
            const start = { latitude: address.latitude, longitude: address.longitude };
            const end = { latitude: borrow.address.latitude, longitude: borrow.address.longitude };
            return calculateDistance(start, end);
        });
        distance = Math.min(...distances);
    }

    // 4. Mapping response
    return {
        id: borrow.id,
        item_name: borrow.item_name,
        description: borrow.description,
        images: borrow.images.map(img =>
            (!img.image_path.startsWith("http") && !img.image_path.startsWith("https"))
                ? getPictureUrl(reqObject, img.image_path)
                : img.image_path
        ),
        category: borrow.category
            ? { id: borrow.category.id, name: borrow.category.name }
            : null,
        status: statusHistory
            ? {
                id: statusHistory.id,
                status: snakeToTitleCase(statusHistory.status),
                updated_at: statusHistory.updated_at
            }
            : null,
        user: borrow.user
            ? {
                id: borrow.user.id,
                profile_picture: (!borrow.user.profile_picture?.startsWith("http") && !borrow.user.profile_picture?.startsWith("https"))
                    ? getPictureUrl(reqObject, borrow.user.profile_picture)
                    : borrow.user.profile_picture,
                username: borrow.user.username,
                fullname: borrow.user.fullname
            }
            : null,
        address: borrow.address
            ? {
                id: borrow.address.id,
                address: borrow.address.address,
                latitude: borrow.address.latitude,
                longitude: borrow.address.longitude
            }
            : null,
        distance,
        phone: borrow.phone
            ? {
                id: borrow.phone.id,
                number: borrow.phone.number
            }
            : null,
        duration_from: borrow.duration_from,
        duration_to: borrow.duration_to,
        borrowing_duration: (borrow.duration_to - borrow.duration_from) / (1000 * 60 * 60 * 24)
        // created_at: borrow.created_at,
        // updated_at: borrow.updated_at
    };
};

export default {
    createBorrow,
    getBorrows,
    getBorrowDetail
};