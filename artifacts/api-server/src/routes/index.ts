import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";
import inventoryRouter from "./inventory";
import profileRouter from "./profile";
import stripeRouter from "./stripe";
import reportsRouter from "./reports";
import adminRouter from "./admin";
import referralRouter from "./referral";
import dueRouter from "./due";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);
router.use(inventoryRouter);
router.use(profileRouter);
router.use(stripeRouter);
router.use(reportsRouter);
router.use(adminRouter);
router.use(referralRouter);
router.use(dueRouter);

router.get("/env-status", (_req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const clerkKey = process.env.CLERK_SECRET_KEY ?? "";
  const nodeEnv = process.env.NODE_ENV ?? "unknown";
  res.json({
    nodeEnv,
    stripeMode: stripeKey.startsWith("sk_live_") ? "live" : "test",
    clerkMode: clerkKey.startsWith("sk_live_") ? "live" : "test",
  });
});

export default router;
