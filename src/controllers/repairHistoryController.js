import { ResponseError } from "../errors/responseError.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import repairHistoryService from "../services/repairHistoryService.js";

const getMyRepairHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const search = req.query.search ?? "";
        const status = req.query.status && req.query.status !== "all"
            ? req.query.status.split(",").map(s => s.trim()).filter(Boolean)
            : [];
        const category = req.query.category && req.query.category !== "all"
            ? req.query.category.split(",").map(c => c.trim()).filter(Boolean)
            : [];
        const repairType = req.query.repairType && req.query.repairType !== "all"
            ? req.query.repairType
            : "all";
        const repairLocation = req.query.repairLocation && req.query.repairLocation !== "all"
            ? req.query.repairLocation
            : "all";
        const page = req.query.page ? Number(req.query.page) : 1;
        const size = req.query.size ? Number(req.query.size) : 10;

        const result = await repairHistoryService.getMyRepairHistory(
            userId, search, status, category, repairLocation, repairType, page, size, req
        );

        res.status(200).json({
            success: true,
            message: req.__("repair.get_history_successful"),
            meta: result.meta,
            data: result.data
        });
    } catch (err) {
        next(err);
    }
};

const getMyRepairDetail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const repairId = Number(req.params.repairId);
        if (!isRequestParameterNumber(repairId)) throw new ResponseError(400, "repair.id_not_a_number");
        const result = await repairHistoryService.getMyRepairDetail(userId, repairId, req);
        res.status(200).json({
            success: true,
            message: req.__('repair.get_detail_successful'),
            data: result
        });
    } catch (err) {
        next(err);
    }
};

export default {
    getMyRepairHistory,
    getMyRepairDetail
};