const express = require("express");
const purchaseRequestController = require("../controllers/purchaseRequest.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const purchaseRequestValidation = require("../validations/purchaseRequest.validation");

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("purchase-requests:view"), validate(purchaseRequestValidation.query, "query"), purchaseRequestController.list);
router.get("/:id", authorize("purchase-requests:view"), purchaseRequestController.getById);
router.post("/", authorize("purchase-requests:create"), validate(purchaseRequestValidation.create, "body"), purchaseRequestController.create);
router.patch("/:id", authorize("purchase-requests:update"), validate(purchaseRequestValidation.update, "body"), purchaseRequestController.update);
router.delete("/:id", authorize("purchase-requests:delete"), purchaseRequestController.remove);

router.post("/:id/submit", authorize("purchase-requests:update"), purchaseRequestController.submit);
router.post("/:id/approve", authorize("purchase-requests:approve"), purchaseRequestController.approve);
router.post("/:id/reject", authorize("purchase-requests:approve"), validate(purchaseRequestValidation.reject, "body"), purchaseRequestController.reject);
router.post("/:id/cancel", authorize("purchase-requests:update"), purchaseRequestController.cancel);

module.exports = router;
