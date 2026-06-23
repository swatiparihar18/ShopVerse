const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod = "Cash on Delivery",
      customerName,
      customerPhone
    } = req.body;

    const requiredAddressFields = ["street", "city", "state", "postalCode", "country"];
    if (!shippingAddress || requiredAddressFields.some((field) => !String(shippingAddress[field] || "").trim())) {
      res.status(400);
      throw new Error("Complete delivery address is required");
    }
    if (!String(customerName || "").trim() || !/^\+?[1-9]\d{7,14}$/.test(String(customerPhone || "").replace(/[\s()-]/g, ""))) {
      res.status(400);
      throw new Error("A valid customer name and phone number are required");
    }
    const whatsappNumber = String(process.env.WHATSAPP_ORDER_NUMBER || process.env.ADMIN_PHONE || "").replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(whatsappNumber)) {
      res.status(503);
      throw new Error("WhatsApp ordering is temporarily unavailable");
    }

    let items = orderItems;

    if (!items || items.length === 0) {
      const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        res.status(400);
        throw new Error("No order items provided and cart is empty");
      }

      items = cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity
      }));
    }

    const orderProducts = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product || item.productId);
        if (!product || !product.isActive || product.status !== "active") {
          res.status(404);
          throw new Error("Product not found");
        }

        const quantity = Number(item.quantity);
        if (!quantity || quantity < 1) {
          res.status(400);
          throw new Error("Each order item needs a quantity of at least 1");
        }

        if (quantity > product.stock) {
          res.status(400);
          throw new Error(`${product.name} does not have enough stock`);
        }

        const price = product.discountPrice > 0 ? product.discountPrice : product.price;
        return {
          product,
          quantity,
          price
        };
      })
    );

    const normalizedItems = orderProducts.map(({ product, quantity, price }) => ({
      product: product._id,
      name: product.name,
      quantity,
      price,
      image: product.images.find((image) => image.isPrimary)?.url || product.imageUrl || product.images[0]?.url || ""
    }));

    const itemsPrice = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxPrice = Math.round(itemsPrice * 0.18);
    const shippingPrice = itemsPrice > 499 ? 0 : 49;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const order = await Order.create({
      user: req.user._id,
      customer: req.user._id,
      orderItems: normalizedItems,
      products: normalizedItems,
      shippingAddress,
      paymentMethod,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      orderStatus: "pending",
      status: "pending",
      paymentStatus: "pending",
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      totalAmount: totalPrice
    });

    await Promise.all(
      orderProducts.map(({ product, quantity }) => {
        product.stock = Math.max(product.stock - quantity, 0);
        return product.save();
      })
    );

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    const addressText = [shippingAddress.street, shippingAddress.city, shippingAddress.state, shippingAddress.postalCode, shippingAddress.country].join(", ");
    const itemLines = normalizedItems.map((item, index) =>
      `${index + 1}. ${item.name} x ${item.quantity} - Rs. ${(item.price * item.quantity).toLocaleString("en-IN")}`
    );
    const message = [
      "Hello, I would like to place this order:",
      "",
      `Order ID: ${order.orderId}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Delivery address: ${addressText}`,
      "",
      "Items:",
      ...itemLines,
      "",
      `Subtotal: Rs. ${itemsPrice.toLocaleString("en-IN")}`,
      ...(Number(taxPrice) > 0 ? [`GST: Rs. ${Number(taxPrice).toLocaleString("en-IN")}`] : []),
      `Delivery: ${Number(shippingPrice) === 0 ? "FREE" : `Rs. ${Number(shippingPrice).toLocaleString("en-IN")}`}`,
      `Total: Rs. ${totalPrice.toLocaleString("en-IN")}`,
      "",
      "Please confirm availability and delivery."
    ].join("\n");

    res.status(201).json({
      success: true,
      order,
      whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      orderMessage: message
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Not authorized to view this order");
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const allowedOrderStatuses = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled"];
    const allowedPaymentStatuses = ["pending", "paid", "unpaid", "failed"];
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (orderStatus) {
      if (!allowedOrderStatuses.includes(orderStatus)) {
        res.status(400);
        throw new Error("Invalid order status");
      }
      order.orderStatus = orderStatus;
      order.status = orderStatus;
      if (orderStatus === "delivered") {
        order.deliveredAt = new Date();
      }
    }

    if (paymentStatus) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        res.status(400);
        throw new Error("Invalid payment status");
      }
      order.paymentStatus = paymentStatus;
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
