import barterService from "../services/barterService.js";
import fs from "fs/promises";
import { logger } from "../application/logging.js";

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
    createBarter
};