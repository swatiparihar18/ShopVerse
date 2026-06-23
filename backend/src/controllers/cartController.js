const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const populateCart = (cartQuery) => {
  return cartQuery.populate("items.product", "name price discountPrice stock images imageUrl category brand status isActive");
};

const removeUnavailableItems = async (cart) => {
  if (!cart) return cart;
  const available = cart.items.filter((item) => item.product && item.product.isActive && item.product.status === "active");
  if (available.length !== cart.items.length) {
    cart.items = available;
  }
  cart.items.forEach((item) => {
    item.price = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
  });
  await cart.save();
  return cart;
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400);
      throw new Error("Product id is required");
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive || product.status !== "active") {
      res.status(404);
      throw new Error("Product not found");
    }

    const requestedQuantity = Number(quantity);
    if (!requestedQuantity || requestedQuantity < 1) {
      res.status(400);
      throw new Error("Quantity must be at least 1");
    }

    if (requestedQuantity > product.stock) {
      res.status(400);
      throw new Error("Requested quantity exceeds available stock");
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

    if (existingItem) {
      const nextQuantity = existingItem.quantity + requestedQuantity;
      if (nextQuantity > product.stock) {
        res.status(400);
        throw new Error("Cart quantity exceeds available stock");
      }
      existingItem.quantity = nextQuantity;
      existingItem.price = itemPrice;
    } else {
      cart.items.push({
        product: product._id,
        quantity: requestedQuantity,
        price: itemPrice
      });
    }

    await cart.save();
    const populatedCart = await removeUnavailableItems(await populateCart(Cart.findById(cart._id)));

    res.status(200).json({
      success: true,
      cart: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const cart = await removeUnavailableItems(await populateCart(Cart.findOne({ user: req.user._id })));

    res.status(200).json({
      success: true,
      cart: cart || { user: req.user._id, items: [] }
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;
    const nextQuantity = Number(quantity);

    if (!nextQuantity || nextQuantity < 1) {
      res.status(400);
      throw new Error("Quantity must be at least 1");
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive || product.status !== "active") {
      res.status(404);
      throw new Error("Product not found");
    }

    if (nextQuantity > product.stock) {
      res.status(400);
      throw new Error("Requested quantity exceeds available stock");
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error("Cart not found");
    }

    const item = cart.items.find((cartItem) => cartItem.product.toString() === productId);
    if (!item) {
      res.status(404);
      throw new Error("Product not found in cart");
    }

    item.quantity = nextQuantity;
    item.price = product.discountPrice > 0 ? product.discountPrice : product.price;

    await cart.save();
    const populatedCart = await removeUnavailableItems(await populateCart(Cart.findById(cart._id)));

    res.status(200).json({
      success: true,
      cart: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error("Cart not found");
    }

    cart.items = cart.items.filter(
      (cartItem) => cartItem.product.toString() !== req.params.productId
    );

    await cart.save();
    const populatedCart = await removeUnavailableItems(await populateCart(Cart.findById(cart._id)));

    res.status(200).json({
      success: true,
      cart: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
