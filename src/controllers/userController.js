import { logger } from "../application/logging.js";
import userService from "../services/userService.js";
import fs from "fs/promises";

const currentUser = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const result = await userService.currentUser(userId, req);
        res.status(200).json({
            success: true,
            // message: 'Get current user successful',
            message: req.__('user.get_current_user_successful'),
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
        const result = await userService.updateCurrentUser(userId, request, req);
        res.status(200).json({
            success: true,
            // message: 'Update current user successful',
            message: req.__('user.update_current_user_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const updateProfilePicture = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const file = req.file;
        const result = await userService.uploadProfilePicture(userId, file);
        res.status(200).json({
            success: true,
            message: req.__("user.update_profile_picture_successful"),
            data: result
        })
    } catch (error) {
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (error) {
                logger.error(`updateProfilePicture in userController.js. Failed to delete uploaded file: ${req.file.path}`, error);
            }
        }
        next(error);
    }
}

export default {
    currentUser, updateCurrentUser, updateProfilePicture
}