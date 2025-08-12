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

export const updateAddressValidation = Joi.object({
    // id: Joi.number().positive().required(),  //addressId from request params 
    addressName: Joi.string().max(255).optional(),
    address: Joi.string().max(255).optional()
});

export const updatePhoneValidation = Joi.object({
    // id: Joi.number().positive().required(),  //phoneId from request params 
    number: Joi.string().max(255).optional()
});