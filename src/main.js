import { env } from "./application/env.js";
import { logger } from "./application/logging.js";
import { web } from "./application/web.js";

web.listen(env.port, "::", () => {
    logger.info(`App start on port ${env.port}`);
});