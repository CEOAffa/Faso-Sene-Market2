import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import pricesRouter from "./prices";
import suppliersRouter from "./suppliers";
import ordersRouter from "./orders";
import deliveriesRouter from "./deliveries";
import adminRouter from "./admin";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(pricesRouter);
router.use(suppliersRouter);
router.use(ordersRouter);
router.use(deliveriesRouter);
router.use(adminRouter);

export default router;
