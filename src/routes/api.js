import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";
import addressController from "../controllers/addressController.js";
import phoneController from "../controllers/phoneController.js";
import { geocodeAddress } from "../application/nodeGeocoder.js";
import { uploadProfilePictureMiddleware } from "../middlewares/uploadMiddleware.js";

const userRouter = express.Router();
// userRouter.use(authMiddleware);

// User API
userRouter.get('/users/current', authMiddleware, userController.currentUser);
userRouter.patch('/users/current', authMiddleware, userController.updateCurrentUser);
userRouter.patch('/users/current/profile-picture', authMiddleware, uploadProfilePictureMiddleware, userController.updateProfilePicture)

// Address API
userRouter.get('/users/current/addresses', authMiddleware, addressController.getAddresses);
userRouter.post('/users/current/addresses', authMiddleware, addressController.createAddress);
userRouter.get('/users/current/addresses/:addressId', authMiddleware, addressController.getAddressById);
userRouter.patch('/users/current/addresses/:addressId', authMiddleware, addressController.updateAddress);
userRouter.delete('/users/current/addresses/:addressId', authMiddleware, addressController.deleteAddress);

// Phone API
userRouter.get('/users/current/phones', authMiddleware, phoneController.getPhones);
userRouter.post('/users/current/phones', authMiddleware, phoneController.createPhone);
userRouter.get('/users/current/phones/:phoneId', authMiddleware, phoneController.getPhoneById);
userRouter.patch('/users/current/phones/:phoneId', authMiddleware, phoneController.updatePhone);
userRouter.delete('/users/current/phones/:phoneId', authMiddleware, phoneController.deletePhone);


userRouter.get('/test/:query', async (req, res, next) => {
    // console.log(`Query: ${req.params.query}`);
    const result = await geocodeAddress(req.params.query)
    res.json({
        data: result
    });
});

export {
    userRouter
}