import Joi from "joi";

export const createBorrowApplicationValidation = Joi.object({
    reason: Joi.string().max(255).required(),
    address_id: Joi.number().positive().required(),
    phone_id: Joi.number().positive().required(),
    duration_from: Joi.date().iso().required(),
    duration_to: Joi.date().iso().greater(Joi.ref('duration_from')).required()
});