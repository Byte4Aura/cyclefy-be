import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import recycleHistoryService from "../services/recycleHistoryService.js";

const getMyRecycleHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const search = req.query.search ?? "";
        const category = req.query.category && req.query.category !== "all"
            ? req.query.category.split(",").map((c) => c.trim()).filter(Boolean)
            : [];
        const status = req.query.status && req.query.status !== "all"
            ? req.query.status.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const page = req.query.page ? Number(req.query.page) : 1;
        const size = req.query.size ? Number(req.query.size) : 10;

        const result = await recycleHistoryService.getMyRecycleHistory(
            userId, search, category, status, page, size, req
        );

        res.status(200).json({
            success: true,
            message: req.__("recycle.get_history_successful"),
            meta: result.meta,
            data: result.data,
        });
    } catch (err) {
        next(err);
    }
};

const getMyRecycleDetail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const recycleId = Number(req.params.recycleId);
        if (!isRequestParameterNumber(recycleId)) throw new ResponseError(400, "recycle.id_not_a_number");
        // const result = await borrowService.getMyBorrowDetail(userId, recycleId, req);
        const result = await recycleHistoryService.getMyRecycleDetail(userId, recycleId, req);
        res.status(200).json({
            success: true,
            message: req.__('recycle.get_detail_successful'),
            data: result
        });
    } catch (err) {
        next(err);
    }
};

export default {
    getMyRecycleHistory,
    getMyRecycleDetail
}