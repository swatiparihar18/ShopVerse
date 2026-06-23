const User = require("../models/User");

const ensureAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing");
    return;
  }

  const existingUser = await User.findOne({ email: ADMIN_EMAIL });
  if (existingUser) {
    existingUser.name = existingUser.name || ADMIN_NAME || "Creation Corner Admin";
    existingUser.role = "admin";
    existingUser.status = "active";
    existingUser.phone = existingUser.phone || process.env.ADMIN_PHONE || "0000000000";
    existingUser.isVerified = true;
    existingUser.password = ADMIN_PASSWORD;
    await existingUser.save();
    console.log(`Admin account updated: ${existingUser.email}`);
    return;
  }

  const admin = await User.create({
    name: ADMIN_NAME || "Creation Corner Admin",
    email: ADMIN_EMAIL,
    phone: process.env.ADMIN_PHONE || "0000000000",
    password: ADMIN_PASSWORD,
    role: "admin",
    status: "active",
    isVerified: true
  });

  console.log(`Admin created: ${admin.email}`);
};

module.exports = ensureAdmin;
