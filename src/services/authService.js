import { registerUserValidation, verifyEmailValidation } from "../validations/userValidation.js";
import { validate } from "../validations/validation.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/ResponseError.js";
import bcrypt from "bcrypt";
import { sendMail } from "../application/mailer.js";
import path from "path";
import { logger } from "../application/logging.js";
import { promises as fs } from "fs";
import fetch from "node-fetch";

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

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
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await prismaClient.emailVerification.create({
            data: {
                user_id: userExistsByEmail.id,
                verification_code: otp,
                expires_at: expiresAt
            }
        });
        await sendMail({
            to: userExistsByEmail.email,
            subject: "Cyclefy - Email Verification OTP",
            html: `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
        });
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

    // Check existing email
    // const existingUser = await prismaClient.user.findFirst({
    //     // where: { email: userData.email }
    //     where: {
    //         OR: [
    //             {
    //                 email: userData.email
    //             },
    //             {
    //                 username: userData.username
    //             }
    //         ]
    //     }
    // });
    // if (existingUser) {

    //     // Return 400 is user email is already verified
    //     if (existingUser.is_email_verified) {
    //         throw new ResponseError(400, "Email or username already registered");
    //     }

    //     // Resent OTP
    //     const otp = generateOTP();
    //     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    //     await prismaClient.emailVerification.create({
    //         data: {
    //             user_id: existingUser.id,
    //             verification_code: otp,
    //             expires_at: expiresAt
    //         }
    //     });
    //     await sendMail({
    //         to: existingUser.email,
    //         subject: "Cyclefy - Email Verification OTP",
    //         html: `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
    //     });
    //     return {
    //         message: "OTP resent, please check your email",
    //         email: existingUser.email
    //     };
    // }

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
    const avatarUrl = `https://ui-avatars.com/api/?name${encodeURIComponent(newUser.username)}`;
    const profileDir = path.resolve('src/assets/profiles');
    const profilePath = path.join(profileDir, `${newUser.username}.png`);
    try {
        // Make sure the folder is exists
        await fs.mkdir(profileDir, { recursive: true, });

        // Download image
        const response = await fetch(avatarUrl);
        if (!response.ok) throw new Error("Failed to fetch avatar");
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(profilePath, buffer);

        // Update User profile_picture
        await prismaClient.user.update({
            where: { id: newUser.id },
            data: { profile_picture: `/src/assets/profiles/${newUser.username}.png` }
        })
    } catch (error) {
        // Optional: log error, but register still success
        logger.error(`Failed to save profile picture: ${error.message}`);
    }

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

export default {
    register, verifyEmail
}