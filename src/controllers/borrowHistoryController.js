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
        const otherItemsStatus = req.query.otherItemsStatus && req.query.otherItemsStatus !== "all"
            ? req.query.otherItemsStatus.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const ownership = req.query.ownership && req.query.ownership !== "all"
            ? req.query.ownership.split(',').map(ownership => ownership.trim()).filter(Boolean)
            : ["my_items", "other_items"];

        const userItemPage = parseInt(req.query.userItemPage) > 0 ? parseInt(req.query.userItemPage) : 1;
        const userItemSize = parseInt(req.query.userItemSize) > 0 ? parseInt(req.query.userItemSize) : 10;

        const otherItemsPage = parseInt(req.query.otherItemsPage) > 0 ? parseInt(req.query.otherItemsPage) : 1;
        const otherItemsSize = parseInt(req.query.otherItemsSize) > 0 ? parseInt(req.query.otherItemsSize) : 10;

        const result = await borrowHistoryService.getBorrowHistory(userId, search, category, userItemStatus, otherItemsStatus, ownership, userItemPage, userItemSize, otherItemsPage, otherItemsSize, req);
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