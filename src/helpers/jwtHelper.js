import { env } from "../application/env.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = env.jwtSecret;

export const generateJWT = (user) => {
    const payload = {
        id: user.id,
        // fullname: user.fullname,
        username: user.username,
        email: user.email,
        // profile_picture: user.profile_picture,
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyJWT = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
        // throw new Error(error.message);
    }
}