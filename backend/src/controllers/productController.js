const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ImportHistory = require("../models/ImportHistory");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { deleteFromCloudinary, uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");

const parseBoolean = (value) => value === true || value === "true";

const uploadProductImages = async (files = []) => {
  return Promise.all(
    files.map((file) => uploadBufferToCloudinary(file.buffer, "shopverse/products"))
  );
};

const parseImageOrder = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const error = new Error("Invalid product image order");
    error.statusCode = 400;
    throw error;
  }
};

const markPrimaryImage = (images, requestedIndex = 0) => {
  const primaryIndex = Math.min(Math.max(Number(requestedIndex) || 0, 0), Math.max(images.length - 1, 0));
  return images.map((image, index) => ({
    url: image.url,
    public_id: image.public_id || "",
    isPrimary: index === primaryIndex
  }));
};

const ensureCanManageProduct = (req, product) => {
  const isAdmin = req.user.role === "admin";
  const isOwner = product.createdBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    const error = new Error("Not authorized to manage this product");
    error.statusCode = 403;
    throw error;
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      heroDescription,
      price,
      discountPrice,
      category,
      brand,
      stock,
      sku,
      imageUrl,
      status,
      isFeatured,
      isActive
    } = req.body;

    if (!name || !price || stock === undefined) {
      res.status(400);
      throw new Error("Name, price, and stock are required");
    }
    if ((req.files || []).length + (imageUrl ? 1 : 0) > 8) {
      res.status(400);
      throw new Error("A product can have at most 8 images");
    }

    const uploadedImages = await uploadProductImages(req.files);
    const urlImage = imageUrl && !uploadedImages.some((image) => image.url === imageUrl)
      ? [{ url: imageUrl, public_id: "" }]
      : [];
    const images = markPrimaryImage([...uploadedImages, ...urlImage], req.body.primaryIndex);
    const product = await Product.create({
      name,
      description: description || "",
      heroDescription: heroDescription || "",
      price,
      discountPrice,
      category: category || "Uncategorized",
      brand: brand || "Creation Corner",
      stock,
      images,
      sku,
      imageUrl,
      status,
      isFeatured: parseBoolean(isFeatured),
      isActive: isActive === undefined ? (status || "active") === "active" : parseBoolean(isActive),
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.active !== "all") {
      filter.isActive = req.query.active === undefined ? true : parseBoolean(req.query.active);
      if (filter.isActive) filter.status = "active";
    }
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.featured !== undefined) filter.isFeatured = parseBoolean(req.query.featured);

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      rating: { rating: -1 }
    };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).populate("createdBy", "name email"),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    next(error);
  }
};

const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true, status: "active" })
      .sort({ updatedAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

const validateProducts = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const ids = Array.isArray(req.body.ids) ? [...new Set(req.body.ids.map(String))].slice(0, 100) : [];
    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
    const products = validIds.length
      ? await Product.find({ _id: { $in: validIds }, isActive: true, status: "active" })
      : [];
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true, status: "active" }).populate("createdBy", "name email");
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment = "", feedback = "" } = req.body;
    const numericRating = Number(rating);
    const reviewComment = feedback || comment;

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      res.status(400);
      throw new Error("Rating must be between 1 and 5");
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      orderStatus: "delivered",
      "orderItems.product": product._id
    });

    if (!deliveredOrder) {
      res.status(403);
      throw new Error("You can review this product after it has been delivered");
    }

    const existingReview = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = reviewComment;
    } else {
      product.reviews.push({
        user: req.user._id,
        name: req.user.name,
        rating: numericRating,
        comment: reviewComment
      });
    }

    product.rating =
      product.reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
      product.reviews.length;

    await product.save();

    res.status(existingReview ? 200 : 201).json({
      success: true,
      message: existingReview ? "Review updated" : "Review added",
      product
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    ensureCanManageProduct(req, product);

    const allowedFields = [
      "name",
      "description",
      "heroDescription",
      "price",
      "discountPrice",
      "category",
      "brand",
      "stock",
      "sku",
      "imageUrl",
      "status"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.isFeatured !== undefined) {
      product.isFeatured = parseBoolean(req.body.isFeatured);
    }
    if (req.body.isActive !== undefined) {
      product.isActive = parseBoolean(req.body.isActive);
      product.status = product.isActive ? "active" : "inactive";
    } else if (req.body.status !== undefined) {
      product.isActive = req.body.status === "active";
    }

    const previousImages = product.images.map((image) => image.toObject());
    const uploadedImages = await uploadProductImages(req.files || []);
    const requestedOrder = parseImageOrder(req.body.imageOrder);
    let nextImages;

    if (requestedOrder.length > 0) {
      nextImages = requestedOrder.map((entry) => {
        if (entry.type === "new") return uploadedImages[Number(entry.index)];
        return previousImages.find((image) =>
          (entry.public_id && image.public_id === entry.public_id) || (!entry.public_id && image.url === entry.url)
        );
      }).filter(Boolean);
    } else {
      nextImages = [...previousImages, ...uploadedImages];
    }

    if (req.body.imageUrl && !nextImages.some((image) => image.url === req.body.imageUrl)) {
      nextImages.push({ url: req.body.imageUrl, public_id: "" });
    }
    if (nextImages.length > 8) {
      await Promise.all(uploadedImages.map((image) => deleteFromCloudinary(image.public_id)));
      res.status(400);
      throw new Error("A product can have at most 8 images");
    }

    product.images = markPrimaryImage(nextImages, req.body.primaryIndex);

    const updatedProduct = await product.save();
    const retainedIds = new Set(updatedProduct.images.map((image) => image.public_id).filter(Boolean));
    const removedImages = previousImages.filter((image) => image.public_id && !retainedIds.has(image.public_id));
    const unusedUploads = uploadedImages.filter((image) => image.public_id && !retainedIds.has(image.public_id));
    await Promise.all([...removedImages, ...unusedUploads].map((image) => deleteFromCloudinary(image.public_id)));

    res.status(200).json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    ensureCanManageProduct(req, product);

    await Promise.all(product.images.map((image) => deleteFromCloudinary(image.public_id)));
    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

const normalizeColumn = (row, column) => {
  const value = row[column];
  return typeof value === "string" ? value.trim() : value;
};

const validateImportRow = (row) => {
  const errors = [];
  const name = normalizeColumn(row, "Product Name");
  const description = normalizeColumn(row, "Description") || "";
  const category = normalizeColumn(row, "Category") || "Uncategorized";
  const imageUrl = normalizeColumn(row, "Image URL") || "";
  const sku = String(normalizeColumn(row, "SKU") || "").trim().toUpperCase();
  const price = Number(normalizeColumn(row, "Price"));
  const stock = Number(normalizeColumn(row, "Stock"));

  if (!name) errors.push("Product Name is required");
  if (!Number.isFinite(price) || price < 0) errors.push("Price is required and must be a non-negative number");
  if (!Number.isInteger(stock) || stock < 0) errors.push("Stock is required and must be a non-negative integer");
  if (!sku) errors.push("SKU is required");

  return {
    errors,
    product: {
      name,
      description,
      category,
      price,
      stock,
      sku,
      imageUrl,
      status: "active"
    }
  };
};

const parseWorkbookRows = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, WTF: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
};

const uploadProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("Spreadsheet file is required");
    }

    const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    const duplicate = await ImportHistory.findOne({ fileHash });
    if (duplicate) {
      res.status(409).json({
        success: false,
        duplicate: true,
        message: "This file has already been imported",
        import: duplicate
      });
      return;
    }

    let rows;
    try {
      rows = parseWorkbookRows(req.file.buffer);
    } catch {
      res.status(400);
      throw new Error("Malformed spreadsheet");
    }

    const result = {
      success: true,
      totalRows: rows.length,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const { errors, product } = validateImportRow(row);
      if (errors.length > 0) {
        result.failed += 1;
        result.errors.push({ row: rowNumber, sku: product.sku, errors });
        continue;
      }

      try {
        const existing = await Product.findOne({ sku: product.sku });
        if (existing) {
          Object.assign(existing, product);
          await existing.save();
          result.updated += 1;
        } else {
          await Product.create({ ...product, createdBy: req.user._id });
          result.imported += 1;
        }
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          row: rowNumber,
          sku: product.sku,
          errors: [error.message || "Unable to import row"]
        });
      }
    }

    await ImportHistory.create({
      fileName: req.file.originalname,
      fileHash,
      totalRows: result.totalRows,
      imported: result.imported,
      updated: result.updated,
      failed: result.failed,
      rowErrors: result.errors.map((item) => ({
        row: item.row,
        sku: item.sku,
        messages: item.errors
      })),
      createdBy: req.user._id
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const templateHeaders = [
  "Product Name",
  "Description",
  "Category",
  "Price",
  "Stock",
  "SKU",
  "Image URL"
];

const templatePath = path.join(__dirname, "..", "templates", "product-import-template.xlsx");

const ensureProductTemplate = () => {
  if (fs.existsSync(templatePath)) return;
  fs.mkdirSync(path.dirname(templatePath), { recursive: true });
  const rows = [
    templateHeaders,
    [
      "Running Shoes",
      "Lightweight daily running shoes",
      "Sports",
      4999,
      25,
      "SHOE-001",
      "https://example.com/images/shoe.jpg"
    ]
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, templatePath);
};

const downloadProductTemplate = async (req, res, next) => {
  try {
    ensureProductTemplate();
    res.download(templatePath, "product-import-template.xlsx");
  } catch (error) {
    next(error);
  }
};

const getImportHistory = async (req, res, next) => {
  try {
    const imports = await ImportHistory.find()
      .sort({ createdAt: -1 })
      .limit(25)
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      imports
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  createProductReview,
  getFeaturedProducts,
  getProducts,
  getProductById,
  validateProducts,
  updateProduct,
  deleteProduct,
  getImportHistory,
  downloadProductTemplate,
  uploadProducts
};
