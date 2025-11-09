import Product from "../models/product.model.js";
import { cacheGet, cacheSet, cacheDel, CacheKeys } from "../lib/redis.js";
import logger from "../lib/logger.js";

// Cache TTL configuration for cart data
const CACHE_TTL = {
  CART: 1800,
};

export const getCartProducts = async (req, res) => {
  logger.info({ userId: req.user._id }, "getCartProducts: Retrieving cart products");
  try {
    const userId = req.user._id.toString();
    const cacheKey = CacheKeys.userCart(userId);
    
    const cachedCart = await cacheGet(cacheKey);
    if (cachedCart) {
      logger.debug({ userId }, "getCartProducts: Cart found in Redis cache");
      return res.json(cachedCart);
    }

    logger.debug({ userId }, "getCartProducts: Cart not in cache, fetching from MongoDB");
    const productIds = req.user.cartItems.map(item => item.product || item.id);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => {
          const cartItemProductId = cartItem.product?.toString() || cartItem.id?.toString();
          return cartItemProductId === product._id.toString();
        }
      );
      return { ...product, quantity: item?.quantity || 1 };
    });

    await cacheSet(cacheKey, cartItems, CACHE_TTL.CART);

    logger.info({ userId, itemCount: cartItems.length }, "getCartProducts: Cart products retrieved successfully");
    res.json(cartItems);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: req.user._id }, "getCartProducts: Error retrieving cart products");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  logger.info({ userId: req.user._id, productId: req.body.productId }, "addToCart: Adding product to cart");
  try {
    const { productId } = req.body;
    const user = req.user;
    const userId = user._id.toString();

    const existingItem = user.cartItems.find(
      (item) => {
        const itemProductId = item.product?.toString() || item.id?.toString();
        return itemProductId === productId;
      }
    );
    if (existingItem) {
      logger.debug({ userId, productId, action: "increment" }, "addToCart: Incrementing existing item quantity");
      existingItem.quantity += 1;
    } else {
      logger.debug({ userId, productId, action: "add" }, "addToCart: Adding new item to cart");
      user.cartItems.push({ product: productId, quantity: 1 });
    }

    await user.save();
    
    await cacheDel(CacheKeys.userCart(userId));
    
    logger.info({ userId, productId, cartItemCount: user.cartItems.length }, "addToCart: Product added to cart successfully");
    res.json(user.cartItems);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: req.user._id, productId: req.body.productId }, "addToCart: Error adding product to cart");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  logger.info({ userId: req.user._id, productId: req.body.productId }, "removeAllFromCart: Removing products from cart");
  try {
    const { productId } = req.body;
    const user = req.user;
    const userId = user._id.toString();
    
    if (!productId) {
      logger.debug({ userId, action: "clear_all" }, "removeAllFromCart: Clearing all cart items");
      user.cartItems = [];
    } else {
      logger.debug({ userId, productId, action: "remove_one" }, "removeAllFromCart: Removing specific product from cart");
      user.cartItems = user.cartItems.filter(
        (item) => {
          const itemProductId = item.product?.toString() || item.id?.toString();
          return itemProductId !== productId;
        }
      );
    }
    await user.save();
    
    await cacheDel(CacheKeys.userCart(userId));
    
    logger.info({ userId, productId, remainingItems: user.cartItems.length }, "removeAllFromCart: Products removed from cart successfully");
    res.json(user.cartItems);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: req.user._id, productId: req.body.productId }, "removeAllFromCart: Error removing products from cart");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  logger.info({ userId: req.user._id, productId: req.params.id, quantity: req.body.quantity }, "updateQuantity: Updating cart item quantity");
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    const userId = user._id.toString();
    const existingItem = user.cartItems.find(
      (item) => {
        const itemProductId = item.product?.toString() || item.id?.toString();
        return itemProductId === productId;
      }
    );

    if (existingItem) {
      if (quantity === 0) {
        logger.debug({ userId, productId, action: "remove" }, "updateQuantity: Removing item from cart (quantity = 0)");
        user.cartItems = user.cartItems.filter(
          (item) => {
            const itemProductId = item.product?.toString() || item.id?.toString();
            return itemProductId !== productId;
          }
        );
        await user.save();
        
        // Invalidate cart cache
        await cacheDel(CacheKeys.userCart(userId));
        
        logger.info({ userId, productId }, "updateQuantity: Item removed from cart successfully");
        return res.json(user.cartItems);
      }

      logger.debug({ userId, productId, oldQuantity: existingItem.quantity, newQuantity: quantity }, "updateQuantity: Updating item quantity");
      existingItem.quantity = quantity;
      await user.save();
      
      // Invalidate cart cache
      await cacheDel(CacheKeys.userCart(userId));
      
      logger.info({ userId, productId, quantity }, "updateQuantity: Cart item quantity updated successfully");
      res.json(user.cartItems);
    } else {
      logger.warn({ userId, productId }, "updateQuantity: Product not found in cart");
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: req.user._id, productId: req.params.id }, "updateQuantity: Error updating cart item quantity");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
