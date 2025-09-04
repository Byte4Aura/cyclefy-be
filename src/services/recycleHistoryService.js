import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { snakeToTitleCase } from "../helpers/statusHelper.js";

const getMyRecycleHistory = async (userId, search, category, statuses, page, size, reqObject) => {
    // Build where clause
    const where = {};

    if (search) {
        where.OR = [
            { item_name: { contains: search } },
            { description: { contains: search } },
            // { category: { name: { contains: search} } }
        ];
    }
    if (category && category.length > 0) {
        where.category = { name: { in: category } };
    }

    // Get data
    const recycles = await prismaClient.recycle.findMany({
        where: {
            ...where,
            user_id: userId,
        },
        // orderBy: { updated_at: "desc" },
        include: {
            images: true,
            category: true,
            recycleStatusHistories: {
                orderBy: { created_at: "desc" },
                take: 1 //take last status
            },
            recycle_location: true,
        }
    });

    let filteredRecycles = recycles;
    // filter last status
    if (statuses && statuses.length > 0) {
        filteredRecycles = recycles.filter(recycle =>
            recycle.recycleStatusHistories.length > 0 &&
            statuses.includes(recycle.recycleStatusHistories[0].status)
        );
    }

    // Pagination
    const total = filteredRecycles.length;
    const pagedRecycles = filteredRecycles.slice((page - 1) * size, page * size);

    // Mapping response
    const data = pagedRecycles.map(recycle => ({
        id: recycle.id,
        item_name: recycle.item_name,
        description: recycle.description,
        images: recycle.images.map(img => {
            if (!img.image_path.startsWith("http") || !img.image_path.startsWith("https")) {
                return getPictureUrl(reqObject, img.image_path);
            }
            return img.image_path;
        }),
        category: recycle.category
            ? { id: recycle.category.id, name: recycle.category.name }
            : null,
        // status: recycle.recycleStatusHistories[0]?.status || null,
        status: recycle.recycleStatusHistories[0]
            ? {
                id: recycle.recycleStatusHistories[0].id,
                status: snakeToTitleCase(recycle.recycleStatusHistories[0].status),
                updated_at: recycle.recycleStatusHistories[0].updated_at
            }
            : null
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

const getMyRecycleDetail = async (userId, recycleId, reqObject) => {
    // 1. Ambil postingan recycle milik user login
    const recycle = await prismaClient.recycle.findUnique({
        where: {
            id: recycleId,
            user_id: userId
        },
        include: {
            images: true,
            category: true,
            address: true,
            recycleStatusHistories: {
                orderBy: { created_at: 'asc' }
            }
        }
    });
    if (!recycle) throw new ResponseError(404, 'recycle.not_found');

    // 2. Mapping status_histories
    const status_histories = recycle.recycleStatusHistories.map(status => ({
        id: status.id,
        status: snakeToTitleCase(status.status),
        status_detail: reqObject.__(status.status_detail),
        updated_at: status.updated_at
    }));

    // 3. Mapping response
    return {
        id: recycle.id,
        item_name: recycle.item_name,
        description: recycle.description,
        category: recycle.category
            ? { id: recycle.category.id, name: recycle.category.name }
            : null,
        images: recycle.images.map(img =>
            (!img.image_path.startsWith('http') && !img.image_path.startsWith('https'))
                ? getPictureUrl(reqObject, img.image_path)
                : img.image_path
        ),
        status: recycle.recycleStatusHistories.length > 0
            ? snakeToTitleCase(recycle.recycleStatusHistories[recycle.recycleStatusHistories.length - 1].status)
            : null,
        status_histories: status_histories,
        address: recycle.address
            ? {
                id: recycle.address.id,
                name: recycle.address.address_name,
                address: recycle.address.address,
                latitude: recycle.address.latitude,
                longitude: recycle.address.longitude
            }
            : null,
    };
};

export default {
    getMyRecycleHistory,
    getMyRecycleDetail
};