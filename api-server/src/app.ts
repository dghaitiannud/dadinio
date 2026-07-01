import express, { type Express, type Request, type Response } from "express";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use((req: Request, res: Response, next) => {
  const startedAt = process.hrtime();
  logger.info({ method: req.method, url: req.url?.split("?")[0] }, "incoming request");

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(startedAt);
    const durationMs = seconds * 1e3 + nanoseconds / 1e6;
    logger.info({ statusCode: res.statusCode, durationMs }, "request completed");
  });

  next();
});
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
