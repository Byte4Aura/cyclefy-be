import { logger } from "../application/logging.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
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

const getMyIncomingRequestDetail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const requestId = Number(req.params.requestId);
        if (!isRequestParameterNumber(requestId))
            throw new ResponseError(400, "barter_application.id_not_a_number");
        const result = await barterApplicationService.getMyIncomingRequestDetail(userId, requestId, req);
        res.status(200).json({
            success: true,
            message: req.__("barter_application.get_detail_successful"),
            data: result
        });
    } catch (err) {
        next(err);
    }
};


export default { createBarterApplication, getMyIncomingRequestDetail };