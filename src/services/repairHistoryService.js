import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { snakeToTitleCase } from "../helpers/statusHelper.js";

const getMyRepairHistory = async (
    userId,
    search = "",
    status = [],
    category = [],
    repairLocation = "all",
    repairType = "all",
    page = 1,
    size = 10,
    reqObject
) => {
    // Build where clause
    const where = {
        user_id: userId
    };

    // Search by item_name or description
    if (search) {
        where.OR = [
            { item_name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
        ];
    }

    // Filter by category
    if (category && category.length > 0 && !category.includes("all")) {
        where.category_id = { in: category.map(Number).filter(Boolean) };
    }

    // Filter by repairLocation
    if (repairLocation && repairLocation !== "all") {
        where.repair_location = repairLocation;
    }

    // Filter by repairType
    if (repairType && repairType !== "all") {
        where.repair_location = repairType;
    }

    // Get data
    const repairs = await prismaClient.repair.findMany({
        where,
        include: {
            images: true,
            category: true,
            repairStatusHistories: {
                orderBy: { created_at: "desc" },
                take: 1
            }
        }
    });

    // Filter by status (last status only)
    let filteredRepairs = repairs;
    if (status && status.length > 0 && !status.includes("all")) {
        filteredRepairs = repairs.filter(r =>
            r.repairStatusHistories[0] &&
            status.includes(r.repairStatusHistories[0].status)
        );
    }

    // Pagination
    const total = filteredRepairs.length;
    const pagedRepairs = filteredRepairs.slice((page - 1) * size, page * size);

    // Mapping response
    const data = pagedRepairs.map(repair => ({
        id: repair.id,
        item_name: repair.item_name,
        description: repair.description,
        images: repair.images.map(img => ({
            id: img.id,
            image_path: (!img.image_path.startsWith('http') || !img.image_path.startsWith('https'))
                ? getPictureUrl(reqObject, img.image_path)
                : img.image_path,
            image_name: img.image_name,
            image_size: img.image_size,
            image_type: snakeToTitleCase(img.image_type)
        })),
        category: repair.category
            ? { id: repair.category.id, name: repair.category.name }
            : null,
        repair_location: snakeToTitleCase(repair.repair_location),
        repair_type: snakeToTitleCase(repair.repair_type),
        status: repair.repairStatusHistories[0]
            ? {
                id: repair.repairStatusHistories[0].id,
                status: snakeToTitleCase(repair.repairStatusHistories[0].status),
                updated_at: repair.repairStatusHistories[0].updated_at
            }
            : null,
    }));

    return {
        meta: {
            total,
            page,
            size,
            totalPages: Math.ceil(total / size)
        },
        data
    };
};

const getMyRepairDetail = async (userId, repairId, reqObject) => {
    // 1. Ambil postingan repair milik user login
    const repair = await prismaClient.repair.findUnique({
        where: {
            id: repairId,
            user_id: userId
        },
        include: {
            images: true,
            category: true,
            address: true,
            phone: true,
            repairStatusHistories: {
                orderBy: { created_at: 'asc' }
            },
            repairPayments: true
        }
    });
    if (!repair) throw new ResponseError(404, "repair.not_found");

    // 2. Mapping status_histories
    const status_histories = repair.repairStatusHistories.map(status => ({
        id: status.id,
        status: snakeToTitleCase(status.status),
        status_detail: reqObject.__(status.status_detail),
        updated_at: status.updated_at
    }));

    // 3. Mapping images
    const images = repair.images.map(img => ({
        id: img.id,
        image_path: (!img.image_path.startsWith('http') && !img.image_path.startsWith('https'))
            ? getPictureUrl(reqObject, img.image_path)
            : img.image_path,
        image_name: img.image_name,
        image_size: img.image_size,
        image_type: snakeToTitleCase(img.image_type)
    }));

    // 4. Mapping response
    return {
        id: repair.id,
        item_name: repair.item_name,
        description: repair.description,
        item_weight: repair.item_weight,
        images,
        category: repair.category
            ? { id: repair.category.id, name: repair.category.name }
            : null,
        address: repair.address
            ? {
                id: repair.address.id,
                address_name: repair.address.address_name,
                address: repair.address.address,
                latitude: repair.address.latitude,
                longitude: repair.address.longitude,
            }
            : null,
        repair_location: snakeToTitleCase(repair.repair_location),
        repair_type: snakeToTitleCase(repair.repair_type),
        status: repair.repairStatusHistories.length > 0
            ? snakeToTitleCase(repair.repairStatusHistories[repair.repairStatusHistories.length - 1].status)
            : null,
        status_histories,
    };
};

export default {
    getMyRepairHistory,
    getMyRepairDetail
};