import { loginUserValidation, registerUserValidation, resendOtpValidation, verifyEmailValidation } from "../validations/userValidation.js";
import { validate } from "../validations/validation.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import bcrypt from "bcrypt";
import { logger } from "../application/logging.js";
import { downloadAndSaveProfileIamge, sendEmailOTP } from "../helpers/authHelper.js";
import { generateJWT } from "../helpers/jwtHelper.js";

const register = async (request) => {
    // Input validation
    const userData = validate(registerUserValidation, request);

    // Check existing email
    const userExistsByEmail = await prismaClient.user.findUnique({
        where: { email: userData.email }
    });
    if (userExistsByEmail) {
        // Return 400 is user email is already verified
        if (userExistsByEmail.is_email_verified) {
            throw new ResponseError(400, "Email already registered");
        }

        // Username must be equal with unverified user
        if (userExistsByEmail.username !== userData.username) {
            throw new ResponseError(400, "Email already registered");
        }

        // Resend OTP
        await sendEmailOTP(userExistsByEmail);

        return {
            message: "OTP resent, please check your email",
            email: userExistsByEmail.email
        };
    }

    // Check existing username
    const userExistsByUsername = await prismaClient.user.findUnique({
        where: { username: userData.username }
    });
    if (userExistsByUsername) {
        throw new ResponseError(400, "Username already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Save new user
    const newUser = await prismaClient.user.create({
        data: {
            username: userData.username,
            fullname: userData.username,
            email: userData.email,
            password: hashedPassword,
            is_email_verified: false,
            is_active: true
        }
    });

    // Create default profile picture using ui-avatars
    await downloadAndSaveProfileIamge(newUser);

    // Generate OTP & save to EmailVerification
    await sendEmailOTP(newUser);

    // Return data without password
    return {
        id: newUser.id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        profile_picture: `/src/assets/profiles/${newUser.username}.png`
    }
}

const verifyEmail = async (request) => {
    const data = validate(verifyEmailValidation, request);

    // Find user
    const user = await prismaClient.user.findUnique({
        where: { email: data.email }
    });
    if (!user) throw new ResponseError(404, "User not found");

    // Find unused & valid OTP
    const otpRecord = await prismaClient.emailVerification.findFirst({
        where: {
            user_id: user.id,
            verification_code: data.otp,
            is_used: false,
            expires_at: { gte: new Date() }
        }
    });
    if (!otpRecord) throw new ResponseError(400, "OTP code is incorrect or has expired");

    // Update user's email status & OTP
    await prismaClient.user.update({
        where: { id: user.id },
        data: {
            is_email_verified: true,
            email_verified_at: new Date()
        }
    });
    await prismaClient.emailVerification.update({
        where: { id: otpRecord.id },
        data: {
            is_used: true,
            verified_at: new Date()
        }
    });

    return {
        email: user.email,
        verified: true,
    }
}

const resendOtp = async (request) => {
    const data = validate(resendOtpValidation, request);

    // Find user
    const user = await prismaClient.user.findUnique({
        where: { email: data.email }
    });
    if (!user) throw new ResponseError(404, "Email not found");
    if (user.is_email_verified) throw new ResponseError(400, "Email already registered");

    // Generate OTP & save to EmailVerification
    await sendEmailOTP(user);

    return {
        message: "OTP resent, please check your email",
        email: userExistsByEmail.email
    };
}

const login = async (request) => {
    const data = validate(loginUserValidation, request);

    // Find user from username or email
    const user = await prismaClient.user.findFirst({
        where: {
            OR: [
                { email: data.identifier },
                { username: data.identifier }
            ]
        }
    });
    if (!user) throw new ResponseError(401, 'Username or password wrong');

    // Check password
    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) throw new ResponseError(401, 'Username or password wrong');

    // Check if account email is verified & account status is active
    if (!user.is_active) throw new ResponseError(403, 'Account is inactive');
    if (!user.is_email_verified) throw new ResponseError(403, 'Email is not verified');

    return {
        token: generateJWT(user),
        user: {
            id: user.id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            profile_picture: user.profile_picture
        }
    };
}

export default {
    register, verifyEmail, resendOtp, login
}