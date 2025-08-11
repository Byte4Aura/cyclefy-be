import authService from "../services/authService.js"

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        if (result.message) {
            // Resend OTP case
            res.status(200).json({
                success: true,
                message: result.message,
                data: { email: result.email }
            });
        } else {
            // First time register case
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email for OTP.',
                data: result
            });
        }
    } catch (error) {
        next(error);
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        const result = await authService.verifyEmail(req.body);
        res.status(200).json({
            success: true,
            message: 'Email verification successful.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const resendEmailVerificationOtp = async (req, res, next) => {
    try {
        const result = await authService.resendEmailVerificationOtp(req.body);
        res.status(200).json({
            success: true,
            message: 'Resend email verification successfull.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({
            success: true,
            message: "Login successful.",
            data: result.user,
            token: result.token
        });
    } catch (error) {
        next(error);
    }
};

const sendResetPasswordOTP = async (req, res, next) => {
    try {
        const result = await authService.sendResetPasswordOTP(req.body);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

export default {
    register, verifyEmail, resendEmailVerificationOtp, login, sendResetPasswordOTP, resetPassword
}