import errorHandler from "errorhandler";
import app from "./app";
import { initializeSchedulers } from "./services/schedulerService";

/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
  app.use();
}

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), "0.0.0.0", () => {
  console.log(
    "  App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");

  // Initialize notification schedulers
  initializeSchedulers();
});

export default server;
