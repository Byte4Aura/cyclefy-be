// src/helpers/borrowHelper.js
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { snakeToTitleCase } from "./statusHelper.js";

/**
 * Cek dan update overdue berdasarkan BorrowApplication (request) yang aktif.
 * - Cari BorrowApplication yang status terakhirnya 'borrowed' atau 'extended' dan duration_to < now
 * - Update status BorrowApplication menjadi 'overdue'
 * - Update status Borrow parent jika status terakhirnya 'lent' atau 'extended'
 */
export const checkAndUpdateOverdueBorrows = async () => {
    const now = new Date();

    // 1. Ambil semua BorrowApplication yang status terakhirnya borrowed/extended dan duration_to < now
    const activeApplications = await prismaClient.borrowApplication.findMany({
        where: {
            duration_to: { lt: now },
            borrowApplicationStatusHistories: {
                some: {
                    // status terakhirnya borrowed/extended
                    status: { in: ["borrowed", "extended"] }
                }
            }
        },
        include: {
            borrow: {
                include: {
                    borrowStatusHistories: {
                        orderBy: { created_at: "desc" },
                        take: 1
                    }
                }
            },
            borrowApplicationStatusHistories: {
                orderBy: { created_at: "desc" },
                take: 1
            }
        }
    });

    for (const app of activeApplications) {
        const lastAppStatus = app.borrowApplicationStatusHistories[0];
        if (!lastAppStatus) continue;
        if (!["borrowed", "extended"].includes(lastAppStatus.status)) continue;

        // 2. Update status BorrowApplication menjadi overdue
        await prismaClient.borrowApplicationStatusHistory.create({
            data: {
                borrow_application_id: app.id,
                status: "overdue",
                status_detail: "borrow_application.request.overdue_detail"
            }
        });

        // 3. Update status Borrow parent jika status terakhirnya lent/extended
        const borrow = app.borrow;
        if (!borrow) continue;
        const lastBorrowStatus = borrow.borrowStatusHistories[0];
        if (!lastBorrowStatus) continue;
        if (["overdue", "returned", "completed", "cancelled"].includes(lastBorrowStatus.status)) continue;
        if (!["lent", "extended"].includes(lastBorrowStatus.status)) continue;

        await prismaClient.borrowStatusHistory.create({
            data: {
                borrow_id: borrow.id,
                status: "overdue",
                status_detail: "borrow.posting.overdue_detail"
            }
        });

        // (Opsional) Kirim notifikasi ke user jika perlu
    }
};

/**
 * Cek dan update semua borrow yang sudah overdue.
 * - Hanya update jika status terakhir 'lent' atau 'extended' dan duration_to < now
 * - Update juga borrowApplication yang statusnya 'borrowed' atau 'extended'
 */
// export const checkAndUpdateOverdueBorrows2 = async () => {
//     const now = new Date();

//     // 1. Ambil semua borrow yang duration_to < now
//     const borrows = await prismaClient.borrow.findMany({
//         where: {
//             duration_to: { lt: now }
//         },
//         include: {
//             borrowStatusHistories: {
//                 orderBy: { created_at: "desc" },
//                 take: 1
//             },
//             applications: {
//                 include: {
//                     borrowApplicationStatusHistories: {
//                         orderBy: { created_at: "desc" },
//                         take: 1
//                     }
//                 }
//             }
//         }
//     });

//     for (const borrow of borrows) {
//         const lastStatus = borrow.borrowStatusHistories[0];
//         if (!lastStatus) continue;

//         // 2. Skip jika status terakhir sudah returned, completed, cancelled, atau overdue
//         if (["returned", "completed", "cancelled", "overdue"].includes(lastStatus.status)) continue;

//         // 3. Hanya proses jika status terakhir lent atau extended
//         if (!["lent", "extended"].includes(lastStatus.status)) continue;

//         // 4. Update status borrow menjadi overdue
//         await prismaClient.borrowStatusHistory.create({
//             data: {
//                 borrow_id: borrow.id,
//                 status: "overdue",
//                 status_detail: "borrow.posting.overdue_detail", // gunakan i18n key
//             }
//         });

//         // 5. Cari borrowApplication yang status terakhirnya borrowed atau extended
//         const activeApp = borrow.applications.find(app => {
//             const lastAppStatus = app.borrowApplicationStatusHistories[0];
//             if (!lastAppStatus) return false;
//             return ["borrowed", "extended"].includes(lastAppStatus.status);
//         });

//         if (activeApp) {
//             await prismaClient.borrowApplicationStatusHistory.create({
//                 data: {
//                     borrow_application_id: activeApp.id,
//                     status: "overdue",
//                     status_detail: "borrow_application.request.overdue_detail", // gunakan i18n key
//                 }
//             });
//         }

//         // (Opsional) Kirim notifikasi ke user jika perlu
//     }
// };