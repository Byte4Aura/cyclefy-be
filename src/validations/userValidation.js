import Joi from "joi";

export const registerUserValidation = Joi.object({
    username: Joi.string().max(255).required(),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(255).required(),
    confirmPassword: Joi.string().equal(Joi.ref('password')).required().messages({
        "any.only": 'confirmPassword must be equal with password'
    })
});

export const verifyEmailValidation = Joi.object({
    email: Joi.string().email().max(255).required(),
    otp: Joi.string().length(4).required()
});

export const resendEmailVerificationOtpValidation = Joi.object({
    email: Joi.string().email().max(255).required(),
});

export const loginUserValidation = Joi.object({
    identifier: Joi.string().max(255).required(), // email atau username
    password: Joi.string().min(8).max(255).required()
});

export const sendResetPasswordOtpValidation = Joi.object({
    email: Joi.string().email().max(255).required()
});

export const resetPasswordValidation = Joi.object({
    email: Joi.string().email().max(255).required(),
    otp: Joi.string().length(4).required(),
    newPassword: Joi.string().min(8).max(255).required(),
    confirmNewPassword: Joi.string().equal(Joi.ref('newPassword')).required().messages({
        "any.only": 'confirmNewPassword must be equal with newPassword'
    })
});

export const getCurrentUserValidation = Joi.number().positive().required();