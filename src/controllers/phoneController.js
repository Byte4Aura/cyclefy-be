import { ResponseError } from "../errors/responseError.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import phoneService from "../services/phoneService.js";

const getPhones = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const result = await phoneService.getPhones(userId);
        res.status(200).json({
            success: true,
            message: req.__('phone.get_list_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const getPhoneById = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const phoneId = Number(req.params.phoneId);
        if (!isRequestParameterNumber(phoneId)) throw new ResponseError(400, 'phone.id_not_a_number');
        const result = await phoneService.getPhoneById(userId, phoneId);
        res.status(200).json({
            success: true,
            message: req.__('phone.get_detail_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const createPhone = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const request = req.body;
        const result = await phoneService.createPhone(userId, request, req);
        res.status(201).json({
            success: true,
            message: req.__('phone.create_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const updatePhone = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const phoneId = Number(req.params.phoneId);
        if (!isRequestParameterNumber(phoneId)) throw new ResponseError(400, 'phone.id_not_a_number');
        const request = req.body;
        const result = await phoneService.updatePhone(userId, phoneId, request, req);
        res.status(200).json({
            success: true,
            message: req.__('phone.update_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const deletePhone = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const phoneId = Number(req.params.phoneId);
        if (!isRequestParameterNumber(phoneId)) throw new ResponseError(400, 'phone.id_not_a_number');
        const result = await phoneService.deletePhone(userId, phoneId)
        res.status(200).json({
            success: true,
            message: req.__('phone.delete_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export default {
    getPhones, getPhoneById, createPhone, updatePhone, deletePhone
}