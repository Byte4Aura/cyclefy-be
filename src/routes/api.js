import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";
import addressController from "../controllers/addressController.js";
import phoneController from "../controllers/phoneController.js";

const userRouter = express.Router();
// userRouter.use(authMiddleware);

// User API
userRouter.get('/users/current', authMiddleware, userController.currentUser);
userRouter.patch('/users/current', authMiddleware, userController.updateCurrentUser);
userRouter.patch('/users/current/addresses/:addressId', authMiddleware, addressController.updateAddress);
userRouter.patch('/users/current/phones/:phoneId', authMiddleware, phoneController.updatePhone);

export {
    userRouter
}