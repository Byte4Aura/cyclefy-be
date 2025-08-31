import express from "express";
import authController from "../controllers/authController.js";

const publicRouter = express.Router();
publicRouter.post('/api/register', authController.register);
publicRouter.post('/api/verify-email', authController.verifyEmail);
publicRouter.post('/api/resend-email-verification-otp', authController.resendEmailVerificationOtp);
publicRouter.post('/api/send-reset-password-otp', authController.sendResetPasswordOTP);
publicRouter.post('/api/verify-reset-passsword-email', authController.verifyResetPasswordOTP);
publicRouter.post('/api/reset-password', authController.resetPassword);
publicRouter.post('/api/users/login', authController.login);

export {
    publicRouter
}