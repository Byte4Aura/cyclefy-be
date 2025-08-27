import barterService from "../services/barterService.js";
import fs from "fs/promises";
import { logger } from "../application/logging.js";

const getBarters = async (req, res, next) => {
    try {
        const searchParam = req.query.search ?? "";
        const category = req.query.category && req.query.category !== "all"
            ? req.query.category.split(',').map(category => category.trim()).filter(Boolean)
            : [];
        const maxDistance = Number(req.query.maxDistance);
        const sortBy = req.query.sortBy ?? "relevance"
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const size = parseInt(req.query.size) > 0 ? parseInt(req.query.size) : 10;
        const userId = req.user.id;

        const result = await barterService.getBarters(userId, searchParam, category, maxDistance, sortBy, page, size, req)
        res.status(201).json({
            success: true,
            message: req.__('barter.get_posts_successful'),
            ...result
        });
    } catch (error) {
        next(error);
    }
};

const createBarter = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const files = req.files;
        const result = await barterService.createBarter(userId, req.body, files, req);
        res.status(201).json({
            success: true,
            message: req.__('barter.create_successful'),
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

export default {
    getBarters,
    createBarter,
};