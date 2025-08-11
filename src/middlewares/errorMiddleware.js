import { logger } from "../application/logging.js";
import { ResponseError } from "../errors/responseError.js";

export const errorMiddleware = (err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    const status = err.status && Number.isInteger(err.status) ? err.status : 500;

    if (err instanceof ResponseError) {
        res.status(status).json({
            success: false,
            message: err.message,
            errors: err.errors
            // errors: err.message.replace(/"/g, ''),
        }).end();
    } else {
        console.info(err);
        res.status(status).json({
            success: false,
            message: err.message || 'Internal Server Error',
            errors: err.errors || null
        }).end();
    }
}