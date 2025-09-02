import { prismaClient } from "../application/database.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { ResponseError } from "../errors/responseError.js";
import { snakeToTitleCase } from "../helpers/statusHelper.js";
import { calculateDistance } from "../helpers/geoHelper.js";

const getBorrowHistory = async (userId, search, category, userItemStatus, otherItemStatus, ownership, userItemPage, userItemSize, otherItemPage, otherItemSize, reqObject) => {
    const data = { my_items: [], other_items: [] };
    const meta = { my_items: {}, other_items: {} };

    // --- MY ITEMS ---
    if (ownership.includes("my_items")) {
        const whereBorrow = { user_id: userId };
        if (category && category.length > 0 && !category.includes("all")) {
            whereBorrow.category = { name: { in: category } };
        }
        if (search) {
            whereBorrow.OR = [
                { item_name: { contains: search } },
                { description: { contains: search } }
            ];
        }

        const myBorrows = await prismaClient.borrow.findMany({
            where: whereBorrow,
            include: {
                images: true,
                category: true,
                borrowStatusHistories: {
                    orderBy: { created_at: "desc" },
                    take: 1
                }
            }
        });

        // Filter status
        let filteredMyBorrows = myBorrows;
        if (userItemStatus && userItemStatus.length > 0) {
            filteredMyBorrows = myBorrows.filter(b =>
                b.borrowStatusHistories.length > 0 &&
                userItemStatus.includes(b.borrowStatusHistories[0].status)
            );
        }

        // Pagination
        const userItemTotal = filteredMyBorrows.length;
        const pagedMyBorrows = filteredMyBorrows.slice(
            (userItemPage - 1) * userItemSize,
            userItemPage * userItemSize
        );

        data.my_items = pagedMyBorrows.map(borrow => ({
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
            status: borrow.borrowStatusHistories[0]
                ? {
                    id: borrow.borrowStatusHistories[0].id,
                    status: snakeToTitleCase(borrow.borrowStatusHistories[0].status),
                    updated_at: borrow.borrowStatusHistories[0].updated_at
                }
                : null,
            duration_from: borrow.duration_from,
            duration_to: borrow.duration_to,
            borrowing_duration: (borrow.duration_to - borrow.duration_from) / (1000 * 60 * 60 * 24)
        }));

        meta.my_items = {
            total: userItemTotal,
            page: userItemPage,
            size: userItemSize,
            totalPages: Math.ceil(userItemTotal / userItemSize)
        };
    }

    // --- OTHER REQUESTS (riwayat request to barter milik current user)
    if (ownership.includes("other_items")) {
        const whereBorrowApp = { user_id: userId };
        if (category && category.length > 0 && !category.includes("all")) {
            whereBorrowApp.category = { name: { in: category } };
        }
        if (search) {
            whereBorrowApp.OR = [
                { reason: { contains: search } }
            ];
        }

        const borrowApps = await prismaClient.borrowApplication.findMany({
            where: whereBorrowApp,
            include: {
                borrow: {
                    include: {
                        user: true,
                        address: true,
                        category: true,
                        images: true
                    }
                },
                borrowApplicationStatusHistories: {
                    orderBy: { created_at: "desc" },
                    take: 1
                }
            }
        });

        // Filter status
        let filteredApps = borrowApps;
        if (otherItemStatus && otherItemStatus.length > 0) {
            filteredApps = borrowApps.filter(app =>
                app.borrowApplicationStatusHistories.length > 0 &&
                otherItemStatus.includes(app.borrowApplicationStatusHistories[0].status)
            );
        }

        // Pagination
        const totalOtherItems = filteredApps.length;
        const pagedOtherItems = filteredApps.slice(
            (otherItemPage - 1) * otherItemSize,
            otherItemPage * otherItemSize
        );

        // Get user addresses for distance calculation
        const userAddresses = await prismaClient.address.findMany({ where: { user_id: userId } });
        if (!userAddresses.length) throw new ResponseError(404, "user.no_address");

        data.other_items = pagedOtherItems.map(app => {
            let distance = null;
            if (userAddresses.length && app.borrow.address) {
                const distances = userAddresses.map(addr =>
                    calculateDistance(
                        { latitude: addr.latitude, longitude: addr.longitude },
                        { latitude: app.borrow.address.latitude, longitude: app.borrow.address.longitude }
                    )
                );
                distance = Math.min(...distances);
            }

            return {
                id: app.id,
                item_name: app.borrow.item_name,
                description: app.borrow.description,
                images: app.borrow.images.map(img =>
                    (!img.image_path.startsWith("http") && !img.image_path.startsWith("https"))
                        ? getPictureUrl(reqObject, img.image_path)
                        : img.image_path
                ),
                category: app.borrow.category
                    ? { id: app.borrow.category.id, name: app.borrow.category.name }
                    : null,
                status: app.borrowApplicationStatusHistories[0]
                    ? {
                        id: app.borrowApplicationStatusHistories[0].id,
                        status: snakeToTitleCase(app.borrowApplicationStatusHistories[0].status),
                        updated_at: app.borrowApplicationStatusHistories[0].updated_at
                    }
                    : null,
                user: app.borrow.user
                    ? {
                        id: app.borrow.user.id,
                        profile_picture: (!app.borrow.user.profile_picture?.startsWith("http") && !app.borrow.user.profile_picture?.startsWith("https"))
                            ? getPictureUrl(reqObject, app.borrow.user.profile_picture)
                            : app.borrow.user.profile_picture,
                        username: app.borrow.user.username,
                        fullname: app.borrow.user.fullname
                    }
                    : null,
                address: app.borrow.address
                    ? {
                        id: app.borrow.address.id,
                        address: app.borrow.address.address,
                        latitude: app.borrow.address.latitude,
                        longitude: app.borrow.address.longitude
                    }
                    : null,
                distance: distance
            };
        });

        meta.other_items = {
            total: totalOtherItems,
            page: otherItemPage,
            size: otherItemSize,
            totalPages: Math.ceil(totalOtherItems / otherItemSize)
        };
    }

    return {
        meta: meta,
        data: data
    };
};

const getMyBorrowRequestDetail = async (userId, requestId, reqObject) => {
    // 1. Ambil borrowApplication milik current user
    const borrowApp = await prismaClient.borrowApplication.findUnique({
        where: { id: requestId },
        include: {
            borrow: {
                include: {
                    images: true,
                    category: true,
                    user: true,
                    address: true
                }
            },
            borrowApplicationStatusHistories: { orderBy: { created_at: "asc" } },
            address: true
        }
    });
    if (!borrowApp) throw new ResponseError(404, "borrow_application.not_found");
    if (borrowApp.user_id !== userId) throw new ResponseError(403, "borrow_application.forbidden");

    // 2. Hitung distance dari alamat user ke address postingan borrow
    const userAddresses = await prismaClient.address.findMany({ where: { user_id: userId } });
    let distance = null;
    if (userAddresses.length && borrowApp.borrow && borrowApp.borrow.address) {
        const distances = userAddresses.map(addr =>
            calculateDistance(
                { latitude: addr.latitude, longitude: addr.longitude },
                { latitude: borrowApp.borrow.address.latitude, longitude: borrowApp.borrow.address.longitude }
            )
        );
        distance = Math.min(...distances);
    }

    // 3. Mapping status_histories dari borrowApplication
    const status_histories = borrowApp.borrowApplicationStatusHistories.map(status => ({
        id: status.id,
        status: snakeToTitleCase(status.status),
        status_detail: reqObject.__(status.status_detail),
        updated_at: status.updated_at
    }));

    // 4. Mapping response utama (data postingan borrow user lain)
    return {
        id: borrowApp.borrow.id,
        item_name: borrowApp.borrow.item_name,
        description: borrowApp.borrow.description,
        images: borrowApp.borrow.images.map(img =>
            (!img.image_path.startsWith("http") && !img.image_path.startsWith("https"))
                ? getPictureUrl(reqObject, img.image_path)
                : img.image_path
        ),
        category: borrowApp.borrow.category
            ? { id: borrowApp.borrow.category.id, name: borrowApp.borrow.category.name }
            : null,
        status: borrowApp.borrowApplicationStatusHistories.length > 0
            ? snakeToTitleCase(borrowApp.borrowApplicationStatusHistories[borrowApp.borrowApplicationStatusHistories.length - 1].status)
            : null,
        status_histories: status_histories,
        address: borrowApp.borrow.address
            ? {
                id: borrowApp.borrow.address.id,
                address: borrowApp.borrow.address.address,
                latitude: borrowApp.borrow.address.latitude,
                longitude: borrowApp.borrow.address.longitude
            }
            : null,
        distance: distance,
        user: borrowApp.borrow.user
            ? {
                id: borrowApp.borrow.user.id,
                profile_picture: (!borrowApp.borrow.user.profile_picture?.startsWith("http") && !borrowApp.borrow.user.profile_picture?.startsWith("https"))
                    ? getPictureUrl(reqObject, borrowApp.borrow.user.profile_picture)
                    : borrowApp.borrow.user.profile_picture,
                username: borrowApp.borrow.user.username,
                fullname: borrowApp.borrow.user.fullname
            }
            : null,
        duration_from: borrowApp.duration_from,
        duration_to: borrowApp.duration_to,
        borrowing_duration: (borrowApp.duration_to - borrowApp.duration_from) / (1000 * 60 * 60 * 24) + 1,
        reason: borrowApp.reason,
        current_user_address: {
            id: borrowApp.address.id,
            address: borrowApp.address.address,
            latitude: borrowApp.address.latitude,
            longitude: borrowApp.address.longitude,
        }
    };
};

export default {
    getBorrowHistory,
    getMyBorrowRequestDetail
};