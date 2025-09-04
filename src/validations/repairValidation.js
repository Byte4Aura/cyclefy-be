import Joi from "joi";

export const createRepairValidation = Joi.object({
    item_name: Joi.string().max(255).required(),
    description: Joi.string().max(255).required(),
    category_id: Joi.number().positive().required(),
    address_id: Joi.number().positive().required(),
    phone_id: Joi.number().positive().required(),
    item_weight: Joi.number().positive().required(),
    repair_type: Joi.string().valid("minor_repair", "moderate_repair", "major_repair").required(),
    repair_location: Joi.string().valid("my_location", "warehouse").required()
});