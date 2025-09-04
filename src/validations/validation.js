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
                } else if (message.includes('action must be one of')) {
                    message = req.__('validation.invalid_action', { value1: 'accept', value2: 'decline' })
                } else if (message.includes('must be in ISO 8601 date format')) {
                    message = req.__('validation.iso_8601_date_format', { field: key })
                } else if (message.includes('duration_to must be greater than')) {
                    message = req.__('validation.invalid_duration')
                } else if (message.includes('repair_type must be one of')) {
                    message = req.__('validation.repair_type_enum_values', { values: "minor_repair, moderate_repair, atau major_repair" })
                } else if (message.includes('repair_location must be one of')) {
                    message = req.__('validation.repair_location_enum_values', { values: "my_location, atau warehouse" })
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