import { ResponseError } from "../errors/responseError.js";
import { verifyJWT } from "../helpers/jwtHelper.js";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith("Bearer ")) throw new ResponseError(401, 'Unauthorized. Need Authorization Token', {
        token: authHeader ?? null,
    });
    const token = authHeader.split(" ")[1];
    const payload = verifyJWT(token);
    if (!payload) throw new ResponseError((401, 'Invalid or expired token', {
        token: authHeader ?? null,
    }));
    req.user = payload;
    next()
}