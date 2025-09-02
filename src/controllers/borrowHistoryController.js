import borrowHistoryService from "../services/borrowHistoryService.js";
import borrowService from "../services/borrowService.js";
import fs from "fs/promises"

const getBorrowHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const search = req.query.search ?? "";

        const category = req.query.category && req.query.category !== "all"
            ? req.query.category.split(',').map(category => category.trim()).filter(Boolean)
            : [];
        const userItemStatus = req.query.userItemStatus && req.query.userItemStatus !== "all"
            ? req.query.userItemStatus.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        const otherRequestStatus = req.query.otherRequestStatus && req.query.otherRequestStatus !== "all"
            ? req.query.otherRequestStatus.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const ownership = req.query.ownership && req.query.ownership !== "all"
            ? req.query.ownership.split(',').map(ownership => ownership.trim()).filter(Boolean)
            : ["my_items", "other_requests"];

        const userItemPage = parseInt(req.query.userItemPage) > 0 ? parseInt(req.query.userItemPage) : 1;
        const userItemSize = parseInt(req.query.userItemSize) > 0 ? parseInt(req.query.userItemSize) : 10;

        const otherRequestPage = parseInt(req.query.otherRequestPage) > 0 ? parseInt(req.query.otherRequestPage) : 1;
        const otherRequestSize = parseInt(req.query.otherRequestSize) > 0 ? parseInt(req.query.otherRequestSize) : 10;

        const result = await borrowHistoryService.getBorrowHistory(userId, search, category, userItemStatus, otherRequestStatus, ownership, userItemPage, userItemSize, otherRequestPage, otherRequestSize, req);
        res.json({
            success: true,
            message: req.__("borrow.get_history_successful"),
            ...result
        });
    } catch (err) {
        next(err);
    }
};

export default {
    getBorrowHistory
};