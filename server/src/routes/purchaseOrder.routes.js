const express = require("express");
const purchaseOrderController = require("../controllers/purchaseOrder.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const purchaseOrderValidation = require("../validations/purchaseOrder.validation");

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("purchase-orders:view"), validate(purchaseOrderValidation.query, "query"), purchaseOrderController.list);
router.get("/:id", authorize("purchase-orders:view"), purchaseOrderController.getById);
router.post("/", authorize("purchase-orders:create"), validate(purchaseOrderValidation.create, "body"), purchaseOrderController.create);
router.patch("/:id", authorize("purchase-orders:update"), validate(purchaseOrderValidation.update, "body"), purchaseOrderController.update);
router.delete("/:id", authorize("purchase-orders:delete"), purchaseOrderController.remove);

// Lifecycle routes
router.post("/:id/submit", authorize("purchase-orders:update"), purchaseOrderController.submit);
router.post("/:id/approve", authorize("purchase-orders:approve"), purchaseOrderController.approve);
router.post("/:id/reject", authorize("purchase-orders:approve"), validate(purchaseOrderValidation.reject, "body"), purchaseOrderController.reject);
router.post("/:id/cancel", authorize("purchase-orders:update"), purchaseOrderController.cancel);

module.exports = router;
