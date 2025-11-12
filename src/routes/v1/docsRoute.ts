import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDocs from "swagger-jsdoc";
import { swaggerOption } from "../../config/option";

const swaggerSpec = swaggerJSDocs(swaggerOption);
const docsRouter = Router();

docsRouter.use("/", (swaggerUi as any).serve);
docsRouter.get("/", (swaggerUi as any).setup(swaggerSpec));

export default docsRouter;
