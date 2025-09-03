import { logger } from "../application/logging.js";
import { ResponseError } from "../errors/responseError.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import recycleService from "../services/recycleService.js";
import fs from "fs/promises";

const getRecycleLocations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const search = req.query.search ?? "";
        const category = req.query.category && req.query.category !== "all"
            ? req.query.category.split(",").map(c => c.trim()).filter(Boolean)
            : [];
        const maxDistance = req.query.maxDistance ? Number(req.query.maxDistance) : null;
        const location = req.query.location ?? "";
        const sortBy = req.query.sortBy ?? "relevance";

        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const size = parseInt(req.query.size) > 0 ? parseInt(req.query.size) : 10;

        const result = await recycleService.getRecycleLocations(
            userId, search, category, maxDistance, location, sortBy, size, page, req
        );
        res.status(200).json({
            success: true,
            message: req.__("recycle_location.get_list_successful"),
            ...result
        });
    } catch (error) {
        next(error);
    }
};

const getRecycleLocationDetail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const recycleLocationId = Number(req.params.recycleLocationId);
        if (!isRequestParameterNumber(recycleLocationId)) throw new ResponseError(400, "recycle_location.id_not_a_number");
        const result = await recycleService.getRecycleLocationDetail(userId, recycleLocationId, req);
        res.status(200).json({
            success: true,
            message: req.__("recycle_location.get_detail_successful"),
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const createRecycle = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const requestBody = req.body;
        const files = req.files;
        const result = await recycleService.createRecycle(userId, requestBody, files, req);
        res.status(201).json({
            success: true,
            message: req.__('recycle.create_successful'),
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
}

export default {
    getRecycleLocations,
    getRecycleLocationDetail,
    createRecycle
};