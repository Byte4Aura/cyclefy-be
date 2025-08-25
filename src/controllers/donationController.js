import donationService from "../services/donationService.js";
import fs from "fs/promises";
import { logger } from "../application/logging.js";
import { prismaClient } from "../application/database.js";
import { getPictureUrl } from "../helpers/fileHelper.js";

const createDonation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const files = req.files;
        const result = await donationService.createDonation(userId, req.body, files, req);
        res.status(201).json({
            success: true,
            message: req.__('donation.create_successful'),
            data: result
        });
    } catch (error) {
        // Hapus semua file jika gagal
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                if (file && file.path) {
                    try { await fs.unlink(file.path); } catch (e) { logger.error("Failed to delete uploaded donation image", e); }
                }
            }
        }
        next(error);
    }
};

const getDonations = async (req, res, next) => {
    try {
        // Parsing and validate query parameters
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const size = parseInt(req.query.size) > 0 ? parseInt(req.query.size) : 10;
        const categoryIds = req.query.category
            ? req.query.category.split(',').map(Number).filter(Boolean)
            : [];
        const statuses = req.query.status
            ? req.query.status.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const result = await donationService.getDonations(
            page,
            size,
            categoryIds,
            statuses,
            req
        );

        res.status(200).json({
            success: true,
            message: req.__('donation.get_list_successful'),
            ...result
        });
    } catch (error) {
        next(error);
    }
};

export default { createDonation, getDonations };