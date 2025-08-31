import { logger } from "../application/logging.js";
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

export default {
    createBorrow,
};