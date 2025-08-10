import authService from "../services/authService.js"

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for OTP.',
            data: result
        });
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

export default {
    register, verifyEmail
}