import { app } from "./app";
import { env } from "./config/env";
import logger from "./utils/logger";

const server = app.listen(env.PORT, () => {
  logger.info(`[API] Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

export { server, app };
