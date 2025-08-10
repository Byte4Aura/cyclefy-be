import { registerUserValidation, verifyEmailValidation } from "../validations/userValidation.js";
import { validate } from "../validations/validation.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/ResponseError.js";
import bcrypt from "bcrypt";
import { sendMail } from "../application/mailer.js";

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const register = async (request) => {
    // Input validation
    const userData = validate(registerUserValidation, request);

    // Check existing email
    const existingUser = await prismaClient.user.findUnique({
        where: { email: userData.email }
    });
    if (existingUser) {
        throw new ResponseError(400, "Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Save new user
    const newUser = await prismaClient.user.create({
        data: {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            is_email_verified: false,
            is_active: true
        }
    });

    // Generate OTP & save to EmailVerification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); //10 minute
    await prismaClient.emailVerification.create({
        data: {
            user_id: newUser.id,
            verification_code: otp,
            expires_at: expiresAt,
        }
    });

    // Send OTP
    await sendMail({
        to: newUser.email,
        subject: "Cyclefy - Email Verification OTP",
        html: `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
    });

    // Return data without password
    return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
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

export default {
    register, verifyEmail
}