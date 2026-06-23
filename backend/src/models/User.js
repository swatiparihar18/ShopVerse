const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    public_id: { type: String, default: "" }
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "" }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active"
    },
    avatar: {
      type: imageSchema,
      default: () => ({})
    },
    address: {
      type: addressSchema,
      default: () => ({})
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Phone is required"],
      unique: true,
      sparse: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      select: false
    },
    otpExpiry: {
      type: Date,
      select: false
    },
    otpLastSentAt: {
      type: Date,
      select: false
    },
    verificationAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (this.isModified("status")) {
    this.isBlocked = this.status === "blocked";
  }
  if (this.isModified("isBlocked")) {
    this.status = this.isBlocked ? "blocked" : "active";
  }

  if (!this.isModified("password")) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchOtp = function matchOtp(enteredOtp) {
  return bcrypt.compare(enteredOtp, this.otp || "");
};

module.exports = mongoose.model("User", userSchema);
