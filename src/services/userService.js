import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { getCurrentUserValidation } from "../validations/userValidation.js";
import { validate } from "../validations/validation.js";

const currentUser = async (userId) => {
    userId = validate(getCurrentUserValidation, userId);

    const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            fullname: true,
            username: true,
            email: true,
            is_email_verified: true,
            email_verified_at: true,
            profile_picture: true,
            is_active: true,
            phones: {
                select: {
                    id: true,
                    number: true
                }
            },
            addresses: {
                select: {
                    id: true,
                    address: true,
                    latitude: true,
                    longitude: true
                }
            },
        }
    });
    if (!user) throw new ResponseError(404, 'User not found');

    return user;
}

export default {
    currentUser
}