import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { updateAddressValidation } from "../validations/addressValidation.js";
import { validate } from "../validations/validation.js";

const updatePhone = async (userId, phoneId, request) => {
    const updateData = validate(updateAddressValidation, request);

    // Make sure this address is owned by user
    const phone = await prismaClient.phone.findUnique({
        where: {
            id: phoneId,
            user_id: userId
        }
    });
    if (!phone) throw new ResponseError(404, 'Phone not found');

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