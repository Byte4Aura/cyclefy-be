import Joi from "joi";

export const updatePhoneValidation = Joi.object({
    // id: Joi.number().positive().required(),  //phoneId from request params 
    number: Joi.string().max(255).optional()
});