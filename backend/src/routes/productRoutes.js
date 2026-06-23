const express = require("express");
const {
  createProduct,
  createProductReview,
  deleteProduct,
  downloadProductTemplate,
  getImportHistory,
  getFeaturedProducts,
  getProductById,
  getProducts,
  validateProducts,
  uploadProducts,
  updateProduct
} = require("../controllers/productController");
const { admin } = require("../middleware/adminMiddleware");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { spreadsheetUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router
  .route("/")
  .get(getProducts)
  .post(protect, admin, upload.array("images", 8), createProduct);

router.get("/template", protect, admin, downloadProductTemplate);
router.get("/imports", protect, admin, getImportHistory);
router.get("/featured", getFeaturedProducts);
router.post("/validate", validateProducts);
router.post("/upload", protect, admin, spreadsheetUpload.single("file"), uploadProducts);
router.post("/:id/reviews", protect, createProductReview);

router
  .route("/:id")
  .get(getProductById)
  .put(protect, admin, upload.array("images", 8), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
