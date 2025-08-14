import { env } from "../application/env.js";
import jwt from "jsonwebtoken";
import { ResponseError } from "../errors/responseError.js";
import { logger } from "../application/logging.js";

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
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new ResponseError(err.statusCode, 'auth.token_expired_helper');
        } else if (err.name === 'JsonWebTokenError') {
            throw new ResponseError(err.statusCode, 'auth.invalid_token_helper');
        } else {
            logger.error(err);
            throw new ResponseError(err.statusCode, 'auth.failed');
        }
    }
}