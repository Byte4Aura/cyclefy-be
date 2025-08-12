import express from "express";
import session from "express-session";
import passport from "./passport.js";
import { env } from "./env.js";
import { errorMiddleware } from "../middlewares/errorMiddleware.js";
import { publicRouter } from "../routes/publicApi.js";
import { userRouter } from "../routes/api.js";
import { oauthRouter } from "../routes/oauthApi.js";
import path from "path";
import { fileURLToPath } from "url"
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";

export const web = express();
web.use(express.json());

web.use(session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
}));
web.use(passport.initialize());
web.use(passport.session());

// API Specification
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, "../../docs/openapi.yaml"));
web.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

web.use(publicRouter);
web.use(oauthRouter);
web.use('/api', userRouter);

web.use((req, res, next) => {
    res.status(404).json({
        success: false,
        errors: `${req.method} ${req.url} not found. Visit /api/docs for documentation`
    });
});

web.use(errorMiddleware);