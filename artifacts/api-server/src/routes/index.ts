import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";
import inventoryRouter from "./inventory";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);
router.use(inventoryRouter);
router.use(profileRouter);

export default router;
