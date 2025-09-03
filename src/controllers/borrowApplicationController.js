import { ResponseError } from "../errors/responseError.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import borrowApplicationService from "../services/borrowApplicationService.js";

const createBorrowApplication = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const borrowId = Number(req.params.borrowId);
        if (!isRequestParameterNumber(borrowId)) throw new ResponseError(400, "borrow.id_not_a_number");
        const result = await borrowApplicationService.createBorrowApplication(userId, borrowId, req.body, req);
        res.status(201).json({
            success: true,
            message: req.__('borrow_application.create_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const extendBorrowApplication = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const borrowId = Number(req.params.borrowId);
        if (!isRequestParameterNumber(borrowId)) throw new ResponseError(400, "borrow.id_not_a_number");
        const requestId = Number(req.params.requestId);
        if (!isRequestParameterNumber(requestId)) throw new ResponseError(400, "borrow_application.id_not_a_number");
        const requestBody = req.body;
        const result = await borrowApplicationService.extendBorrowApplication(userId, borrowId, requestId, requestBody, req);
        res.status(201).json({
            success: true,
            message: req.__('borrow_application.create_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
};



export default {
    createBorrowApplication,
    extendBorrowApplication
}