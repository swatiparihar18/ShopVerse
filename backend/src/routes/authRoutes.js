const express = require("express");
const {
  getProfile,
  login,
  logout,
  register,
  resendOtp,
  forgotPassword,
  resetPassword,
  verifyOtp,
  updateProfile
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.single("avatar"), updateProfile);

module.exports = router;
