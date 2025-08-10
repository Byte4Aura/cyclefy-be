import express from "express";
import { publicRouter } from "../routes/publicApi.js";
import { errorMiddleware } from "../middlewares/errorMiddleware.js";
import path from "path";
import { fileURLToPath } from "url"
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";

export const web = express();
web.use(express.json());

// API Specification
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, "../../docs/openapi.yaml"));
web.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

web.use(publicRouter);

web.use((req, res, next) => {
    res.status(404).json({
        success: false,
        errors: `${req.url} not found`
    });
});

web.use(errorMiddleware);