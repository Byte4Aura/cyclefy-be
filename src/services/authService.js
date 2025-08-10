import { registerUserValidation } from "../validations/userValidation.js";
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

export default {
    register
}