import Joi from "joi";

export const registerUserValidation = Joi.object({
    username: Joi.string().max(255).required(),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(255).required(),
    confirmPassword: Joi.string().equal(Joi.ref('password')).required()
});