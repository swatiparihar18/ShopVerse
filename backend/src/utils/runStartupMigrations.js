const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const crypto = require("crypto");

const runStartupMigrations = async () => {
  const [roleResult, blockedResult, productResult, orderResult, returnStatusResult, refundStatusResult, productBrandResult, adminBrandResult] = await Promise.all([
    User.updateMany({ role: { $in: ["user", "vendor", null] } }, { $set: { role: "customer" } }),
    User.updateMany({ status: "blocked" }, { $set: { isBlocked: true } }),
    Product.updateMany(
      { $or: [{ status: { $exists: false } }, { imageUrl: { $exists: false } }] },
      [{ $set: { status: { $ifNull: ["$status", "active"] }, imageUrl: { $ifNull: ["$imageUrl", { $first: "$images.url" }] } } }]
    ),
    Order.updateMany(
      {
        $or: [
          { customer: { $exists: false } },
          { products: { $exists: false } },
          { totalAmount: { $exists: false } },
          { status: { $exists: false } }
        ]
      },
      [
        {
          $set: {
            customer: { $ifNull: ["$customer", "$user"] },
            products: { $cond: [{ $gt: [{ $size: { $ifNull: ["$products", []] } }, 0] }, "$products", "$orderItems"] },
            totalAmount: { $ifNull: ["$totalAmount", "$totalPrice"] },
            status: { $ifNull: ["$status", "$orderStatus"] }
          }
        }
      ]
    ),
    Order.updateMany(
      { $or: [{ orderStatus: { $in: ["return", "returned"] } }, { status: { $in: ["return", "returned"] } }] },
      { $set: { orderStatus: "cancelled", status: "cancelled" } }
    ),
    Order.updateMany({ paymentStatus: "refunded" }, { $set: { paymentStatus: "unpaid" } }),
    Product.updateMany({ brand: { $regex: /^ShopVerse$/i } }, { $set: { brand: "Creation Corner" } }),
    User.updateMany({ name: { $regex: /^ShopVerse Admin$/i } }, { $set: { name: "Creation Corner Admin" } })
  ]);

  const legacyProducts = await Product.find({
    $or: [{ images: { $size: 0 } }, { "images.isPrimary": { $exists: false } }]
  });
  for (const product of legacyProducts) {
    product.isActive = product.status === "active";
    if (product.images.length === 0 && product.imageUrl) {
      product.images = [{ url: product.imageUrl, public_id: "", isPrimary: true }];
    } else if (product.images.length > 0) {
      product.images.forEach((image, index) => { image.isPrimary = index === 0; });
    }
    await product.save();
  }

  await Product.updateMany(
    { isActive: { $exists: false } },
    [{ $set: { isActive: { $eq: ["$status", "active"] } } }]
  );

  const legacyOrders = await Order.find({ orderId: { $exists: false } });
  for (const order of legacyOrders) {
    order.orderId = `SV-${order._id.toString().slice(-10).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    order.customerName = order.customerName || "Customer";
    order.customerPhone = order.customerPhone || "Not provided";
    order.itemsPrice = order.itemsPrice || Math.max(order.totalPrice - order.taxPrice - order.shippingPrice, 0);
    await order.save();
  }

  console.log(
    `Migrations complete: roles=${roleResult.modifiedCount}, blocked=${blockedResult.modifiedCount}, products=${productResult.modifiedCount + legacyProducts.length}, orders=${orderResult.modifiedCount + legacyOrders.length}, returnStatuses=${returnStatusResult.modifiedCount}, refunds=${refundStatusResult.modifiedCount}, productBrands=${productBrandResult.modifiedCount}, adminBrands=${adminBrandResult.modifiedCount}`
  );
};

module.exports = runStartupMigrations;
