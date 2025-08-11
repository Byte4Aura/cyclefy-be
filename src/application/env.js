import dotenv from "dotenv";
dotenv.config();

export const env = {
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    mail: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
        from: process.env.MAIL_FROM,
        secure: process.env.MAIL_SECURE
    },
    google: {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
    },
    sessionSecret: process.env.SESSION_SECRET,
    jwtSecret: process.env.JWT_SECRET
};