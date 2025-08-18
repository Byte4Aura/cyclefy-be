import { promises as fs } from "fs";
import { prismaClient } from "../application/database.js";
import { sendMail } from "../application/mailer.js";
import path from "path";
import fetch from "node-fetch";

export const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const downloadAndSaveProfileIamge = async (user) => {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`;
    const profileDir = path.resolve('src/assets/profiles');
    const profilePath = path.join(profileDir, `${user.username}.png`);
    try {
        // Make sure the folder is exists
        await fs.mkdir(profileDir, { recursive: true, });

        // Download image
        const response = await fetch(avatarUrl);
        if (!response.ok) throw new Error("helper.failed_to_fetch_avatar");
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(profilePath, buffer);

        // Update User profile_picture
        await prismaClient.user.update({
            where: { id: user.id },
            data: { profile_picture: `/assets/profiles/${user.username}.png` }
        });
    } catch (error) {
        // Optional: log error, but register still success
        logger.error(`Failed to save profile picture: ${error.message}`);
    }
}

export const generateUniqueUsername = async (baseName) => {
    let username = baseName.replace(/\s+/g, '').toLowerCase();
    let suffix = '';
    let exists = true;
    let attempt = 0;
    while (exists) {
        const check = await prismaClient.user.findUnique({ where: { username: username + suffix } });
        if (!check) break;
        attempt++;
        suffix = '_' + Math.floor(Math.random() * 10000); // atau bisa pakai providerId/email prefix
        // if (attempt > 10) throw new Error("helper.failed_generate_unique_username");
    }
    return username + suffix;
};

export const sendEmailVerificationOTP = async (user) => {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); //10 minute
    await prismaClient.emailVerification.create({
        data: {
            user_id: user.id,
            verification_code: otp,
            expires_at: expiresAt,
        }
    });

    // Send OTP
    await sendMail({
        to: user.email,
        subject: "Cyclefy - Email Verification OTP",
        html: `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
    });
}

export const sendResetPasswordOTPHelper = async (user) => {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); //10 minute
    await prismaClient.passwordReset.create({
        data: {
            user_id: user.id,
            expires_at: expiresAt,
            otp: otp,
            is_used: false,
        }
    });

    // Send OTP
    await sendMail({
        to: user.email,
        subject: "Cyclefy - Password Reset OTP",
        html: `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
    });
}
