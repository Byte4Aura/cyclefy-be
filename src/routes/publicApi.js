import express from "express";
import authController from "../controllers/authController.js";

const publicRouter = express.Router();
publicRouter.post('/api/register', authController.register);
publicRouter.post('/api/verify-email', authController.verifyEmail);
publicRouter.post('/api/resend-otp', authController.resendOtp);

export {
    publicRouter
}