import { ResponseError } from "../errors/responseError.js";
import { isRequestParameterNumber } from "../helpers/controllerHelper.js";
import addressService from "../services/addressService.js";

const getAddresses = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await addressService.getAddresses(userId);
        res.status(200).json({
            success: true,
            message: req.__('address.get_list_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const getAddressById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const addressId = Number(req.params.addressId);
        if (!isRequestParameterNumber(addressId)) throw new ResponseError(400, "address.id_not_a_number");
        const result = await addressService.getAddressById(userId, addressId);
        res.status(200).json({
            success: true,
            message: req.__('address.get_detail_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const createAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const request = req.body;
        const result = await addressService.createAddress(userId, request, req);
        res.status(200).json({
            success: true,
            message: req.__('address.create_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const updateAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const addressId = Number(req.params.addressId);
        if (!isRequestParameterNumber(addressId)) throw new ResponseError(400, "address.id_not_a_number");
        const request = req.body;
        const result = await addressService.updateAddress(userId, addressId, request, req);
        res.status(200).json({
            success: true,
            message: req.__('address.update_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const deleteAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const addressId = Number(req.params.addressId);
        if (!isRequestParameterNumber(addressId)) throw new ResponseError(400, "address.id_not_a_number");
        const result = await addressService.deleteAddress(userId, addressId);
        res.status(200).json({
            success: true,
            message: req.__('address.delete_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}


export default {
    getAddresses, getAddressById, updateAddress, createAddress, deleteAddress
}