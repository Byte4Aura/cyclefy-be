import { logger } from "../application/logging.js";
import userService from "../services/userService.js";

const currentUser = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const result = await userService.currentUser(userId);
        res.status(200).json({
            success: true,
            message: 'Get current user successful',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const updateCurrentUser = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const request = req.body;
        const result = await userService.updateCurrentUser(userId, request);
        res.status(200).json({
            success: true,
            message: 'Update current user successful',
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
        const request = req.body;
        const result = await userService.updateAddress(userId, addressId, request);
        res.status(200).json({
            success: true,
            message: 'Update address for current user successful',
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
        const request = req.body;
        const result = await userService.updatePhone(userId, phoneId, request);
        res.status(200).json({
            success: true,
            message: 'Update phone for current user successful',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export default {
    currentUser, updateCurrentUser, updateAddress, updatePhone
}