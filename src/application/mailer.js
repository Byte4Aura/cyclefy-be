import nodemailer from "nodemailer";
import { env } from "./env.js";
import { logger } from "./logging.js";
import { ResponseError } from "../errors/ResponseError.js";

const transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: {
        user: env.mail.user,
        pass: env.mail.pass
    }
});

export const sendMail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: env.mail.from,
            to,
            subject,
            html
        });
        logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Email send failed: ${error.message}`);
        throw new ResponseError(error.responseCode, error.message);
    }
};