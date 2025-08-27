import { ResponseError } from "../errors/responseError.js";

export const validate = (schema, request, req = null) => {
    const result = schema.validate(request, {
        abortEarly: false,  //return all request field errors
        allowUnknown: false  //reject unknown request field
    });

    if (result.error) {
        // Transform each Joi error to be an object field
        const errors = {};
        result.error.details.forEach((detail) => {
            // const key = detail.path[0];
            // if (!errors[key]) errors[key] = [];
            // errors[key].push(detail.message.replace(/["]/g, ""));

            const key = detail.path[0];
            if (!errors[key]) errors[key] = [];
            let message = detail.message.replace(/["]/g, "");
            if (req && req.__) {
                if (message.includes('confirmPassword must be equal with password')) {
                    message = req.__('validation.confirm_password_missmatch');
                } else if (message.includes('confirmNewPassword must be equal with newPassword')) {
                    message = req.__('validation.confirm_new_password_mismatch');
                } else if (message.includes('required')) {
                    message = req.__('validation.field_required', { field: key });
                } else if (message.includes('email must be a valid email')) {
                    message = req.__('validation.valid_email');
                } else if (message.includes('password length must be at least 8 characters long')) {
                    message = req.__('validation.password_length');
                } else if (message.includes('is not allowed')) {
                    message = req.__('validation.not_allowed', { field: key });
                }
                // console.log(`[validation.js] message: ${message}`);
            }
            errors[key].push(message);
        });
        throw new ResponseError(400, "validation.failed", errors);
    } else {
        return result.value;
    }
}