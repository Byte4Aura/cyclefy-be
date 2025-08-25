import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";
import addressController from "../controllers/addressController.js";
import phoneController from "../controllers/phoneController.js";
import { geocodeAddress } from "../application/nodeGeocoder.js";
import { uploadProfilePictureMiddleware } from "../middlewares/uploadMiddleware.js";
import categoryController from "../controllers/categoryController.js";
import { uploadDonationImageMiddleware } from "../middlewares/donations/uploadDonationMiddleware.js";
import donationController from "../controllers/donationController.js";
import { env } from "../application/env.js";

const userRouter = express.Router();
// userRouter.use(authMiddleware);

// User API
userRouter.get('/users/current', authMiddleware, userController.currentUser);
userRouter.patch('/users/current', authMiddleware, userController.updateCurrentUser);
userRouter.patch('/users/current/profile-picture', authMiddleware, uploadProfilePictureMiddleware, userController.updateProfilePicture)

// Categories API
userRouter.get('/categories', authMiddleware, categoryController.getCategories);

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

// Donation API
userRouter.get('/donations', authMiddleware, donationController.getDonations);
userRouter.post('/donations', authMiddleware, uploadDonationImageMiddleware, donationController.createDonation);
userRouter.get('/donations/:donationId', authMiddleware,);

userRouter.get('/test/:query', async (req, res, next) => {
    // console.log(`Query: ${req.params.query}`);
    const result = await geocodeAddress(req.params.query)
    res.json({
        data: result
    });
});

userRouter.get('/tes/pexels/:query', async (req, res) => {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${req.params.query}`, {
        headers: {
            'Authorization': 'EXoKdHXVmyVkHkLtVatSDz5zRh0EhY4zFwWTJY0a5XXWDI7pn2Cy9ija'
        }
    });
    const data = await response.json();
    res.json({
        data: data.photos[0].src.medium
    });
})

export {
    userRouter
}