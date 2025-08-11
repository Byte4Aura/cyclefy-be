import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const userRouter = express.Router();
userRouter.use(authMiddleware);

userRouter.get('/profile', (req, res) => {
    res.json({ success: true, data: req.user });
});

export {
    userRouter
}