import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";

const userRouter = express.Router();
userRouter.use(authMiddleware);

// User API
userRouter.get('/users/current', userController.currentUser);
userRouter.get('/profile', (req, res) => {
    res.json({ success: true, data: req.user });
});

export {
    userRouter
}