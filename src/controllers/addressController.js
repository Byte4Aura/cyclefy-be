import addressService from "../services/addressService.js";

const updateAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;  //req.user created from ./../middlewares/authMiddleware.js
        const addressId = Number(req.params.addressId);
        const request = req.body;
        const result = await addressService.updateAddress(userId, addressId, request);
        res.status(200).json({
            success: true,
            message: 'Update address for current user successful',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export default {
    updateAddress
}