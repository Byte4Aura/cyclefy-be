import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";

export const addressIdOwnershipValidate = async (userId, addressId) => {
    const user = await prismaClient.address.findUnique({
        where: {
            id: addressId,
            user_id: userId
        }
    });
    if (!user) throw new ResponseError(404, 'address.not_found');
}

export const phoneIdOwnershipValidate = async (userId, phoneId) => {
    const user = await prismaClient.phone.findUnique({
        where: {
            id: phoneId,
            user_id: userId
        }
    });
    if (!user) throw new ResponseError(404, 'phone.not_found');
}

export const isCategoryIdValid = async (categoryId) => {
    const category = await prismaClient.category.findUnique({
        where: { id: categoryId }
    });
    if (!category) throw new ResponseError(404, 'category.not_found');
}