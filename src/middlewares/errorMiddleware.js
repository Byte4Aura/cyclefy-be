import { logger } from "../application/logging.js";
import { ResponseError } from "../errors/ResponseError.js";

export const errorMiddleware = (err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    if (err instanceof ResponseError) {
        res.status(err.status).json({
            success: false,
            message: err.message,
            errors: err.errors
            // errors: err.message.replace(/"/g, ''),
        }).end();
    } else {
        console.info(err);
        res.status(err.status).json({
            success: false,
            message: err.message,
            errors: err.errors
        }).end();
    }
}