import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { updatePhoneValidation } from "../validations/phoneValidation.js";
import { validate } from "../validations/validation.js";

const updatePhone = async (userId, phoneId, requestBody, reqObject) => {
    const updateData = validate(updatePhoneValidation, requestBody, reqObject);

    // Make sure this address is owned by user
    const phone = await prismaClient.phone.findUnique({
        where: {
            id: phoneId,
            user_id: userId
        }
    });
    if (!phone) throw new ResponseError(404, 'phone.not_found');

    // Update phone
    await prismaClient.phone.update({
        where: { id: phoneId },
        data: updateData
    });

    return updateData;
}

export default {
    updatePhone,
}