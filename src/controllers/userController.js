import { logger } from "../application/logging.js";
import userService from "../services/userService.js";

const currentUser = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const result = await userService.currentUser(userId);
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
        const result = await userService.updateCurrentUser(userId, request);
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

export default {
    currentUser, updateCurrentUser,
}