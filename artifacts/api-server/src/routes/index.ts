import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import agentsRouter from "./agents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(agentsRouter);

export default router;
