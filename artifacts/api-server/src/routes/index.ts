import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import agentsRouter from "./agents";
import securityRouter from "./security";
import telemetryRouter from "./telemetry.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(securityRouter);
router.use(chatRouter);
router.use(agentsRouter);
router.use(telemetryRouter);

export default router;
