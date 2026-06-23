const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false }
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    heroDescription: { type: String, trim: true, maxlength: 240, default: "" },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    category: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      default: "Creation Corner",
      trim: true
    },
    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: 0,
      default: 0
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (images) => images.length <= 8,
        message: "A product can have at most 8 images"
      }
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "active"
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviews: {
      type: [reviewSchema],
      default: []
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

productSchema.pre("validate", function syncImageUrl(next) {
  if (this.isModified("status") && !this.isModified("isActive")) this.isActive = this.status === "active";
  if (this.isModified("isActive")) this.status = this.isActive ? "active" : "inactive";
  if (!this.imageUrl && this.images && this.images[0]) {
    this.imageUrl = this.images[0].url;
  }
  if (this.imageUrl && (!this.images || this.images.length === 0)) {
    this.images = [{ url: this.imageUrl, public_id: "", isPrimary: true }];
  }
  if (this.images && this.images.length > 0) {
    const primaryIndex = this.images.findIndex((image) => image.isPrimary);
    const selectedIndex = primaryIndex >= 0 ? primaryIndex : 0;
    this.images.forEach((image, index) => {
      image.isPrimary = index === selectedIndex;
    });
    this.imageUrl = this.images[selectedIndex].url;
  }
  next();
});

productSchema.index({ name: "text", description: "text", category: 1, brand: 1, sku: 1 });
productSchema.index({ isFeatured: 1, isActive: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
