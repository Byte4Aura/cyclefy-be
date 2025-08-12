import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";
import addressController from "../controllers/addressController.js";
import phoneController from "../controllers/phoneController.js";

const userRouter = express.Router();
userRouter.use(authMiddleware);

// User API
userRouter.get('/users/current', userController.currentUser);
userRouter.patch('/users/current', userController.updateCurrentUser);
userRouter.patch('/users/current/addresses/:addressId', addressController.updateAddress);
userRouter.patch('/users/current/phones/:phoneId', phoneController.updatePhone);

export {
    userRouter
}