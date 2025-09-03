import Joi from "joi";

export const createBorrowValidation = Joi.object({
    item_name: Joi.string().max(255).required(),
    description: Joi.string().max(255).required(),
    category_id: Joi.number().positive().required(),
    address_id: Joi.number().positive().required(),
    phone_id: Joi.number().positive().required(),
    duration_from: Joi.date().iso().required(), // format: YYYY-MM-DD or ISO string
    duration_to: Joi.date().iso().greater(Joi.ref('duration_from')).required()
});

export const processBorrowRequestValidation = Joi.object({
    action: Joi.string().max(255).valid("accept", "decline").required(),
    decline_reason: Joi.string().max(255).when("action", { is: "decline", then: Joi.required(), otherwise: Joi.optional })
});