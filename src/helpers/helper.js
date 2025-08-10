import { prismaClient } from "../application/database.js";

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
        // if (attempt > 10) throw new Error("Failed to generate unique username");
    }
    return username + suffix;
};