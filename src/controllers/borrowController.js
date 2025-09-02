import { logger } from "../application/logging.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import borrowService from "../services/borrowService.js";
import fs from "fs/promises"

const createBorrow = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const requestBody = req.body;
        const result = await borrowService.createBorrow(userId, requestBody, req.files, req);
        res.status(201).json({
            success: true,
            message: req.__("borrow.create_successful"),
            data: result
        });
    } catch (error) {
        // Hapus file jika gagal
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                if (file && file.path) {
                    try { await fs.unlink(file.path); } catch (e) { logger.error("Failed to delete uploaded barter image", e); }
                }
            }
        }
        next(error);
    }
};

const getBorrows = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const searchParam = req.query.search ?? "";
        const category = req.query.category && req.query.category !== "all"
            ? req.query.category.split(',').map(category => category.trim()).filter(Boolean)
            : [];
        const maxDistance = req.query.maxDistance ? Number(req.query.maxDistance) : null;
        const location = req.query.location ?? null;
        const from = req.query.from ?? null;
        const to = req.query.to ?? null;
        const days = req.query.days ? Number(req.query.days) : null;
        const sortBy = req.query.sortBy ?? "relevance";
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const size = parseInt(req.query.size) > 0 ? parseInt(req.query.size) : 10;

        const result = await borrowService.getBorrows(
            userId, searchParam, category, maxDistance, location, from, to, days, sortBy, page, size, req
        );
        res.status(200).json({
            success: true,
            message: req.__('borrow.get_posts_successful'),
            ...result
        });
    } catch (error) {
        next(error);
    }
};

const getBorrowDetail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const borrowId = Number(req.params.borrowId);
        if (!isRequestParameterNumber(borrowId)) throw new ResponseError(400, "borrow.id_not_a_number");
        const result = await borrowService.getBorrowDetail(userId, borrowId, req);
        res.status(200).json({
            success: true,
            message: req.__("borrow.get_detail_successful"),
            data: result
        });
    } catch (err) {
        next(err);
    }
};

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

        const result = await borrowService.getBorrowHistory(userId, search, category, userItemStatus, otherRequestStatus, ownership, userItemPage, userItemSize, otherRequestPage, otherRequestSize, req);
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
    createBorrow,
    getBorrows,
    getBorrowDetail,
    getBorrowHistory
};