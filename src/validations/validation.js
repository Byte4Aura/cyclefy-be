import { ResponseError } from "../errors/responseError.js";

export const validate = (schema, request) => {
    const result = schema.validate(request, {
        abortEarly: false,  //return all request field errors
        allowUnknown: false  //reject unknown request field
    });

    if (result.error) {
        // Ubah error Joi menjadi objek per field
        const errors = {};
        result.error.details.forEach((detail) => {
            const key = detail.path[0];
            if (!errors[key]) errors[key] = [];
            errors[key].push(detail.message.replace(/["]/g, ""));
        });
        throw new ResponseError(400, "Validation failed", errors);
    } else {
        return result.value;
    }
}