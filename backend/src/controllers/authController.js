const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const { deleteFromCloudinary, uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production"
};

const sendAuthResponse = (res, statusCode, user) => {
  const token = generateToken(user._id);
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;

  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: safeUser
  });
};

const normalizeEmail = (email = "") => email.toLowerCase().trim();
const normalizePhone = (phone = "") => phone.trim();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone) || /^\+?[1-9]\d{7,14}$/.test(phone);
const isStrongPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const sendOtpToUser = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: "Verify your Creation Corner account",
    text: `Your Creation Corner verification OTP is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>Verify your Creation Corner account</h2>
        <p>Your OTP is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>
        <p>This OTP expires in 5 minutes.</p>
      </div>
    `
  });
};

const setUserOtp = async (user) => {
  const otp = generateOtp();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  user.otpLastSentAt = new Date();
  user.verificationAttempts = 0;
  await user.save();

  try {
    await sendOtpToUser(user, otp);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Unable to send OTP email. Please try again later.");
    }

    console.warn(`Unable to send OTP email: ${error.message}`);
    console.warn(`Development OTP for ${user.email}: ${otp}`);
  }
};

const register = async (req, res, next) => {
  console.log("REGISTER HIT");
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!name || !normalizedPhone || !normalizedEmail || !password) {
      res.status(400);
      throw new Error("Name, phone, email, and password are required");
    }
    if (!isValidPhone(normalizedPhone)) {
      res.status(400);
      throw new Error("Enter a valid phone number");
    }
    if (!isValidEmail(normalizedEmail)) {
      res.status(400);
      throw new Error("Enter a valid email address");
    }
    if (!isStrongPassword(password)) {
      res.status(400);
      throw new Error("Password must be at least 8 characters and include uppercase, lowercase, and a number");
    }

    const existingUser = await User.findOne({ email: normalizedEmail })
      .select("+otp +otpExpiry +otpLastSentAt +verificationAttempts +password");

    if (existingUser) {
      if (existingUser.isVerified) {
        res.status(400);
        throw new Error("Email already exists");
      }

      const phoneOwner = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: existingUser._id }
      });
      if (phoneOwner) {
        res.status(400);
        throw new Error("Phone already exists");
      }

      existingUser.name = name;
      existingUser.phone = normalizedPhone;
      existingUser.email = normalizedEmail;
      existingUser.password = password;
      existingUser.role = "customer";
      existingUser.status = "active";
      existingUser.isVerified = false;
      await setUserOtp(existingUser);

      res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify your account.",
        email: normalizedEmail
      });
      return;
    }

    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      res.status(400);
      throw new Error("Phone already exists");
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      role: "customer",
      status: "active",
      isVerified: false
    });

    await setUserOtp(user);

    res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify your account.",
      email: normalizedEmail
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      res.status(400);
      throw new Error("Email and OTP are required");
    }

    const user = await User.findOne({ email }).select("+otp +otpExpiry +verificationAttempts");
    if (!user) {
      res.status(404);
      throw new Error("Account not found");
    }
    if (user.isVerified) {
      res.status(400);
      throw new Error("Account is already verified");
    }
    if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      res.status(400);
      throw new Error("OTP expired. Please resend OTP.");
    }
    if (user.verificationAttempts >= 5) {
      res.status(429);
      throw new Error("Maximum OTP attempts reached. Please resend OTP.");
    }

    const matches = await user.matchOtp(otp);
    if (!matches) {
      user.verificationAttempts += 1;
      await user.save();
      res.status(400);
      throw new Error("Invalid OTP");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpLastSentAt = undefined;
    user.verificationAttempts = 0;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }

    const user = await User.findOne({ email }).select("+otp +otpExpiry +otpLastSentAt +verificationAttempts");
    if (!user) {
      res.status(404);
      throw new Error("Account not found");
    }
    if (user.isVerified) {
      res.status(400);
      throw new Error("Account is already verified");
    }
    if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < 60 * 1000) {
      res.status(429);
      throw new Error("Please wait 60 seconds before requesting another OTP");
    }

    await setUserOtp(user);

    res.status(200).json({
      success: true,
      message: "OTP resent to your email"
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const genericMessage = "If an account exists for that email, a password reset link has been sent.";
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      res.status(200).json({ success: true, message: genericMessage });
      return;
    }

    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
      const resetUrl = `${frontendUrl}/reset-password/${token}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Creation Corner password",
          text: `Reset your Creation Corner password using this link: ${resetUrl}. The link expires in 15 minutes.`,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Reset your password</h2><p>This secure link expires in 15 minutes and can be used once.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, ignore this email.</p></div>`
        });
      } catch (emailError) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.error(`Unable to send password reset email: ${emailError.message}`);
      }
    }

    res.status(200).json({ success: true, message: genericMessage });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const token = String(req.params.token || "");
    const { password } = req.body;
    if (!token || !isStrongPassword(password)) {
      res.status(400);
      throw new Error("Use a valid reset link and a password with at least 8 characters, uppercase, lowercase, and a number");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      res.status(400);
      throw new Error("This password reset link is invalid or has expired");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.cookie("token", "", { ...cookieOptions, expires: new Date(0) });
    res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (user.isBlocked || (user.status && user.status !== "active")) {
      res.status(403);
      throw new Error("Your account is not active");
    }
    if (user.isVerified === false) {
      res.status(403);
      throw new Error("Please verify your email with OTP before logging in");
    }

    sendAuthResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.cookie("token", "", {
      ...cookieOptions,
      expires: new Date(0)
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { name, phone, address } = req.body;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    const nextAddress = {
      ...(address && typeof address === "object" ? address : {})
    };

    ["street", "city", "state", "postalCode", "country"].forEach((field) => {
      const bracketKey = `address[${field}]`;
      if (req.body[bracketKey] !== undefined) {
        nextAddress[field] = req.body[bracketKey];
      }
    });

    if (Object.keys(nextAddress).length > 0) {
      user.address = {
        ...user.address.toObject(),
        ...nextAddress
      };
    }

    if (req.file) {
      if (user.avatar && user.avatar.public_id) {
        await deleteFromCloudinary(user.avatar.public_id);
      }
      user.avatar = await uploadBufferToCloudinary(req.file.buffer, "shopverse/avatars");
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword
};
