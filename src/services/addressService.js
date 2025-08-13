import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { updateAddressValidation } from "../validations/addressValidation.js";
import { validate } from "../validations/validation.js";

const updateAddress = async (userId, addressId, requestBody, reqObject) => {
    const updateData = validate(updateAddressValidation, requestBody, reqObject);

    // Make sure this address is owned by user
    const address = await prismaClient.address.findUnique({
        where: {
            id: addressId,
            user_id: userId
        }
    });
    if (!address) throw new ResponseError(404, 'address.not_found');

    // Update address
    await prismaClient.address.update({
        where: { id: addressId },
        data: {
            address_name: updateData.addressName,
            address: updateData.address,
        }
    });

    return updateData;
}

export default {
    updateAddress,
}