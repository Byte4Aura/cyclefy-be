import { prismaClient } from "../application/database.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { ResponseError } from "../errors/responseError.js";
import { snakeToTitleCase } from "../helpers/statusHelper.js";
import { calculateDistance } from "../helpers/geoHelper.js";

const getBorrowHistory = async (userId, search, category, userItemStatus, otherRequestStatus, ownership, userItemPage, userItemSize, otherRequestPage, otherRequestSize, reqObject) => {
    const data = { my_items: [], other_requests: [] };
    const meta = { my_items: {}, other_requests: {} };

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

    // --- OTHER REQUESTS (INCOMING REQUESTS TO MY ITEMS) ---
    if (ownership.includes("other_requests")) {
        // Get all borrow ids owned by user
        const myBorrowIds = (
            await prismaClient.borrow.findMany({
                where: { user_id: userId },
                select: { id: true }
            })
        ).map(b => b.id);

        let filteredBorrowApplications = [];
        if (myBorrowIds.length > 0) {
            const whereBorrowApp = {
                borrow_id: { in: myBorrowIds },
                user_id: { not: userId }
            };
            if (search) {
                whereBorrowApp.OR = [
                    { reason: { contains: search } }
                ];
            }

            const borrowApplications = await prismaClient.borrowApplication.findMany({
                where: whereBorrowApp,
                include: {
                    // borrow: {
                    //     include: { address: true }
                    // },
                    address: true,
                    borrowApplicationStatusHistories: {
                        orderBy: { created_at: "desc" },
                        take: 1
                    },
                    user: true
                }
            });

            // Filter status
            filteredBorrowApplications = borrowApplications;
            if (otherRequestStatus && otherRequestStatus.length > 0) {
                filteredBorrowApplications = borrowApplications.filter(app =>
                    app.borrowApplicationStatusHistories.length > 0 &&
                    otherRequestStatus.includes(app.borrowApplicationStatusHistories[0].status)
                );
            }

            // Pagination
            const totalOtherRequests = filteredBorrowApplications.length;
            const pagedOtherRequests = filteredBorrowApplications.slice(
                (otherRequestPage - 1) * otherRequestSize,
                otherRequestPage * otherRequestSize
            );

            // Get user addresses for distance calculation
            const userAddresses = await prismaClient.address.findMany({
                where: { user_id: userId }
            });
            if (!userAddresses.length) throw new ResponseError(404, "user.no_address");

            data.other_requests = pagedOtherRequests.map(app => {
                // Distance: min dari semua address user ke address postingan borrow
                let distance = null;
                if (userAddresses.length && app.address) {
                    const distances = userAddresses.map(addr =>
                        calculateDistance(
                            { latitude: addr.latitude, longitude: addr.longitude },
                            { latitude: app.address.latitude, longitude: app.address.longitude }
                        )
                    );
                    distance = Math.min(...distances);
                }

                return {
                    id: app.id,
                    reason: app.reason,
                    duration_from: app.duration_from,
                    duration_to: app.duration_to,
                    borrowing_duration: (app.duration_to - app.duration_from) / (1000 * 60 * 60 * 24) + 1,
                    status: app.borrowApplicationStatusHistories[0]
                        ? {
                            id: app.borrowApplicationStatusHistories[0].id,
                            status: snakeToTitleCase(app.borrowApplicationStatusHistories[0].status),
                            updated_at: app.borrowApplicationStatusHistories[0].updated_at
                        }
                        : null,
                    address: app.address
                        ? {
                            id: app.address.id,
                            address: app.address.address,
                            latitude: app.address.latitude,
                            longitude: app.address.longitude
                        }
                        : null,
                    distance: distance,
                    user: app.user
                        ? {
                            id: app.user.id,
                            profile_picture: (!app.user.profile_picture?.startsWith("http") && !app.user.profile_picture?.startsWith("https"))
                                ? getPictureUrl(reqObject, app.user.profile_picture)
                                : app.user.profile_picture,
                            fullname: app.user.fullname,
                            username: app.user.username
                        }
                        : null
                };
            });

            meta.other_requests = {
                total: totalOtherRequests,
                page: otherRequestPage,
                size: otherRequestSize,
                totalPages: Math.ceil(totalOtherRequests / otherRequestSize)
            };
        } else {
            meta.other_requests = {
                total: 0,
                page: otherRequestPage,
                size: otherRequestSize,
                totalPages: 0
            };
        }
    }

    return {
        meta: meta,
        data: data
    };
};

export default {
    getBorrowHistory
};