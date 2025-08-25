import Joi from "joi";

export const createDonationValidation = Joi.object({
    item_name: Joi.string().max(255).required(),
    description: Joi.string().max(255).required(),
    category_id: Joi.number().positive().required(),
    address_id: Joi.number().positive().required(),
    phone_id: Joi.number().positive().required()
});