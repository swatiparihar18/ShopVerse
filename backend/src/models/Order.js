const mongoose = require("mongoose");
const crypto = require("crypto");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => `SV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    customerName: { type: String, required: true, trim: true, default: "Customer" },
    customerPhone: { type: String, required: true, trim: true, default: "Not provided" },
    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item"
      }
    },
    products: {
      type: [orderItemSchema],
      default: []
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "unpaid", "failed"],
      default: "pending"
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    status: {
      type: String,
      enum: ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    taxPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    deliveredAt: {
      type: Date
    }
  },
  { timestamps: true }
);

orderSchema.pre("validate", function syncCanonicalFields(next) {
  this.customer = this.customer || this.user;
  this.products = this.products && this.products.length > 0 ? this.products : this.orderItems;
  this.status = this.status || this.orderStatus;
  this.orderStatus = this.orderStatus || this.status;
  this.totalAmount = this.totalAmount || this.totalPrice;
  next();
});

module.exports = mongoose.model("Order", orderSchema);
