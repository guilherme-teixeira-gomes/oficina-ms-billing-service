import { Router } from "express";
import { BillingController } from "../controllers/BillingController";

const routes = Router();
const controller = new BillingController();

routes.get("/billing/:orderId/budget", (req, res) => controller.getBudget(req, res));
routes.get("/billing/:orderId/payment", (req, res) => controller.getPayment(req, res));

export { routes };
