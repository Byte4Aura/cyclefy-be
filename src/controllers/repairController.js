import { ResponseError } from "../errors/responseError.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import repairService from "../services/repairService.js";

const getRepairPrice = async (req, res, next) => {
    try {
        const categoryId = Number(req.params.categoryId);
        if (!isRequestParameterNumber(categoryId)) throw new ResponseError(400, "category.id_not_a_number");
        const result = await repairService.getRepairPrice(categoryId);
        res.status(200).json({
            success: true,
            message: req.__("repair.get_price_list_successful"),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const createRepair = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const requestBody = req.body;
        const files = req.files;
        const result = await repairService.createRepair(userId, requestBody, files, req);
        res.status(201).json({
            success: true,
            message: req.__("repair.create_successful"),
            data: result
        });
    } catch (error) {
        // Hapus file jika gagal (opsional, jika pakai multer disk)
        next(error);
    }
};

const getRepairDetail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const repairId = Number(req.params.repairId);
        if (!isRequestParameterNumber(repairId)) throw new ResponseError(400, "repair.id_not_a_number");
        const result = await repairService.getRepairDetail(userId, repairId, req);
        res.status(200).json({
            success: true,
            message: req.__("repair.get_detail_successful"),
            data: result
        });
    } catch (error) {
        // Hapus file jika gagal (opsional, jika pakai multer disk)
        next(error);
    }
};

const requestRepairPayment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const repairId = Number(req.params.repairId);
        const { paymentType, bankCode, ewalletType } = req.body;
        const result = await repairService.requestRepairPayment(userId, repairId, paymentType, { bankCode, ewalletType });
        res.status(200).json({
            success: true,
            message: req.__("repair.payment_request_successful"),
            data: result
        });
    } catch (err) {
        next(err);
    }
};

export default {
    getRepairPrice,
    getRepairDetail,
    createRepair,
    requestRepairPayment
}