import Joi from "joi";

export const updateAddressValidation = Joi.object({
    // id: Joi.number().positive().required(),  //addressId from request params 
    addressName: Joi.string().max(255).optional(),
    address: Joi.string().max(255).optional()
});