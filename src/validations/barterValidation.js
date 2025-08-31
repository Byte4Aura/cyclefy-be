import Joi from "joi";

export const createBarterValidation = Joi.object({
    item_name: Joi.string().max(255).required(),
    description: Joi.string().max(255).required(),
    category_id: Joi.number().positive().required(),
    address_id: Joi.number().positive().required(),
    phone_id: Joi.number().positive().required()
});

export const processBarterRequestValidation = Joi.object({
    action: Joi.string().max(255).valid("accept", "decline").required(),
    decline_reason: Joi.string().max(255).when("action", { is: "decline", then: Joi.required(), otherwise: Joi.optional })
});