import phoneService from "../services/phoneService.js";

const updatePhone = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const phoneId = Number(req.params.phoneId);
        const request = req.body;
        const result = await phoneService.updatePhone(userId, phoneId, request);
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
    updatePhone
}