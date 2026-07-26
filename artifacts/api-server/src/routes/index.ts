import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import agentsRouter from "./agents";
import securityRouter from "./security";
import telemetryRouter from "./telemetry.js";
import projectsRouter from "./projects.js";
import workspaceRouter from "./workspace.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(securityRouter);
router.use(chatRouter);
router.use(agentsRouter);
router.use(telemetryRouter);
router.use(projectsRouter);
// V10.2: Manual Development Intelligence workspace routes
router.use(workspaceRouter);

export default router;
