import Joi from "joi";

export const getCurrentUserValidation = Joi.number().positive().required();

export const updateUserValidation = Joi.object({
    fullname: Joi.string().max(255),
    username: Joi.string().max(255),
    oldPassword: Joi.string().min(8).max(255),
    password: Joi.string().min(8).max(255),
    confirmPassword: Joi.string().equal(Joi.ref('password')).messages({
        "any.only": 'confirmPassword must be equal with password'
    })
}).or('fullname', 'username', 'password'); // Minimal satu field