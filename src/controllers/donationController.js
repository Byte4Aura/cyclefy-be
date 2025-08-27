import donationService from "../services/donationService.js";
import fs from "fs/promises";
import { logger } from "../application/logging.js";
import { prismaClient } from "../application/database.js";
import { getPictureUrl } from "../helpers/fileHelper.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import { ResponseError } from "../errors/responseError.js";

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
        const category = req.query.category && req.query.category !== "all"
            ? req.query.category.split(',').map(category => category.trim()).filter(Boolean)
            : [];
        const status = req.query.status && req.query.status !== "all"
            ? req.query.status.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const userId = req.user.id

        const result = await donationService.getDonations(
            userId,
            page,
            size,
            category,
            status,
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

const getDonationDetail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const donationId = Number(req.params.donationId);
        if (!isRequestParameterNumber(donationId)) throw new ResponseError(400, 'donation.id_not_a_number');
        const result = await donationService.getDonationDetail(userId, donationId, req);
        res.status(201).json({
            success: true,
            message: req.__('donation.get_detail_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export default { createDonation, getDonations, getDonationDetail };