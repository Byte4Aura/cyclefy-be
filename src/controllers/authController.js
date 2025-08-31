import authService from "../services/authService.js"

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body, req);
        if (result.message) {
            // Resend OTP case
            res.status(200).json({
                success: true,
                message: req.__(result.message),
                data: { email: result.email }
            });
        } else {
            // First time register case
            res.status(201).json({
                success: true,
                message: req.__('auth.register_successful'),
                data: result
            });
        }
    } catch (error) {
        next(error);
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        const result = await authService.verifyEmail(req.body, req);
        res.status(200).json({
            success: true,
            message: req.__('auth.email_verification_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const resendEmailVerificationOtp = async (req, res, next) => {
    try {
        const result = await authService.resendEmailVerificationOtp(req.body, req);
        res.status(200).json({
            success: true,
            message: req.__('auth.resend_email_verification_successful'),
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body, req);
        res.status(200).json({
            success: true,
            message: req.__("auth.login_successful"),
            data: result.user,
            token: result.token
        });
    } catch (error) {
        next(error);
    }
};

const sendResetPasswordOTP = async (req, res, next) => {
    try {
        const result = await authService.sendResetPasswordOTP(req.body, req);
        res.status(200).json({
            success: true,
            message: req.__(result.message)
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body, req);
        res.status(200).json({
            success: true,
            message: req.__(result.message),
        });
    } catch (error) {
        next(error);
    }
};

const verifyResetPasswordOTP = async (req, res, next) => {
    try {
        const result = await authService.verifyResetPasswordOTP(req.body, req);
        res.status(200).json({
            success: true,
            message: req.__("auth.reset_password_otp_valid"),
            data: { ...result }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    register, verifyEmail, resendEmailVerificationOtp, login, sendResetPasswordOTP, resetPassword, verifyResetPasswordOTP
}