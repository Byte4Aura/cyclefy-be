import { logger } from "../application/logging.js";
import barterApplicationService from "../services/barterApplicationService.js";
import fs from "fs/promises";

const createBarterApplication = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const barterId = Number(req.params.barterId);
        const files = req.files;
        const result = await barterApplicationService.createBarterApplication(userId, barterId, req.body, files, req);
        res.status(201).json({
            success: true,
            message: req.__('barter_application.create_successful'),
            data: result
        });
    } catch (error) {
        // Hapus file jika gagal
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                if (file && file.path) {
                    try { await fs.unlink(file.path); } catch (e) { logger.error("Failed to delete uploaded barter application image", e); }
                }
            }
        }
        next(error);
    }
};

export default { createBarterApplication };