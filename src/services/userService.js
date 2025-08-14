import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { getCurrentUserValidation, updateUserValidation } from "../validations/userValidation.js";
import { validate } from "../validations/validation.js";
import bcrypt from "bcrypt";

const currentUser = async (userId, reqObject) => {
    userId = validate(getCurrentUserValidation, userId, reqObject);

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
            phones: true,
            // phones: {
            //     select: {
            //         id: true,
            //         number: true
            //     }
            // },
            addresses: true
            // addresses: {
            //     select: {
            //         id: true,
            //         address: true,
            //         latitude: true,
            //         longitude: true
            //     }
            // },
        }
    });
    if (!user) throw new ResponseError(404, "user.not_found");

    return user;
}

// Update user's username, or fullname, or password
const updateCurrentUser = async (userId, requestBody, reqObject) => {
    const updateData = validate(updateUserValidation, requestBody, reqObject);

    // Find user
    const user = await prismaClient.user.findUnique({
        where: { id: userId }
    });
    if (!user) throw new ResponseError(404, 'user.not_found');

    // Update new password if exists
    if (updateData.password) {
        if (!updateData.oldPassword || !updateData.confirmPassword) throw new ResponseError(400, 'user.old_and_new_password_required');
        const match = await bcrypt.compare(updateData.oldPassword, user.password);
        if (!match) throw new ResponseError(400, 'user.old_password_incorrect');
        updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    // Remove confirmPassword & oldPassword from reques
    delete updateData.oldPassword
    delete updateData.confirmPassword

    // Update User
    await prismaClient.user.update({
        where: { id: user.id },
        data: updateData
    });

    return updateData
}

export default {
    currentUser, updateCurrentUser
}