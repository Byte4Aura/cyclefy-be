import { prismaClient } from "../application/database.js";
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

export default {
    getMyRepairHistory
};