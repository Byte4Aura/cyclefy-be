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

export default {
    getRepairPrice,
    createRepair
}