import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";

const userRouter = express.Router();
userRouter.use(authMiddleware);

// User API
userRouter.get('/users/current', userController.currentUser);
userRouter.patch('/users/current', userController.updateCurrentUser);
userRouter.patch('/users/current/addresses/:addressId', userController.updateAddress);
userRouter.patch('/users/current/phones/:phoneId', userController.updatePhone);

export {
    userRouter
}