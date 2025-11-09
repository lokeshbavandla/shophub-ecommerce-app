import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import { stripe } from "../lib/stripe.js";
import { cacheDel, cacheDelPattern, cacheSet, CacheKeys } from "../lib/redis.js";
import logger from "../lib/logger.js";

export const createCheckoutSession = async (req, res) => {
  logger.info({ userId: req.user._id, productCount: req.body.products?.length, couponCode: req.body.couponCode }, "createCheckoutSession: Creating checkout session");
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      logger.warn({ userId: req.user._id }, "createCheckoutSession: Invalid or empty products array");
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let totalAmount = 0;
    logger.debug({ userId: req.user._id, productCount: products.length }, "createCheckoutSession: Processing products");

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100);
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;
    if (couponCode) {
      logger.debug({ userId: req.user._id, couponCode }, "createCheckoutSession: Looking up coupon");
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        const discountAmount = Math.round((totalAmount * coupon.discountPercentage) / 100);
        logger.info({ userId: req.user._id, couponCode, discountPercentage: coupon.discountPercentage, discountAmount }, "createCheckoutSession: Coupon applied");
        totalAmount -= discountAmount;
      } else {
        logger.warn({ userId: req.user._id, couponCode }, "createCheckoutSession: Coupon not found or inactive");
      }
    }

    logger.debug({ userId: req.user._id, totalAmount }, "createCheckoutSession: Creating Stripe checkout session");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    logger.info({ userId: req.user._id, sessionId: session.id, totalAmount }, "createCheckoutSession: Stripe checkout session created successfully");

    if (totalAmount >= 20000) {
      logger.info({ userId: req.user._id, totalAmount }, "createCheckoutSession: Creating new coupon (order amount >= ₹200)");
      await createNewCoupon(req.user._id);
    }
    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: req.user._id }, "createCheckoutSession: Error processing checkout");
    res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

export const checkoutSuccess = async (req, res) => {
  logger.info({ sessionId: req.body.sessionId }, "checkoutSuccess: Processing successful checkout");
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logger.debug({ sessionId, paymentStatus: session.payment_status }, "checkoutSuccess: Stripe session retrieved");

    if (session.payment_status === "paid") {
      logger.info({ sessionId, userId: session.metadata.userId }, "checkoutSuccess: Payment confirmed, processing order");
      
      if (session.metadata.couponCode) {
        logger.debug({ sessionId, couponCode: session.metadata.couponCode }, "checkoutSuccess: Deactivating used coupon");
        const userId = session.metadata.userId;
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: userId,
          },
          {
            isActive: false,
          }
        );
        
        // Invalidate coupon caches
        await cacheDel(CacheKeys.couponByCode(session.metadata.couponCode));
        await cacheDel(CacheKeys.userCoupon(userId));
        
        logger.info({ sessionId, couponCode: session.metadata.couponCode }, "checkoutSuccess: Coupon deactivated");
      }

      const products = JSON.parse(session.metadata.products);
      logger.debug({ sessionId, productCount: products.length }, "checkoutSuccess: Creating order");
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
      });

      await newOrder.save();
      
      // Clear cart from database after successful payment
      const user = await User.findById(session.metadata.userId);
      if (user) {
        user.cartItems = [];
        await user.save();
        logger.debug({ userId: session.metadata.userId }, "checkoutSuccess: Cart cleared from database");
      }
      
      await cacheDel(CacheKeys.analyticsData());
      await cacheDelPattern("analytics:daily:*");
      await cacheDel(CacheKeys.userCart(session.metadata.userId));
      
      logger.info({ sessionId, orderId: newOrder._id, userId: session.metadata.userId, totalAmount: newOrder.totalAmount }, "checkoutSuccess: Order created successfully");

      res.status(200).json({
        success: true,
        message:
          "Payment successful, order created, and coupon deactivated if used.",
        orderId: newOrder._id,
      });
    } else {
      logger.warn({ sessionId, paymentStatus: session.payment_status }, "checkoutSuccess: Payment not confirmed");
    }
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, sessionId: req.body.sessionId }, "checkoutSuccess: Error processing successful checkout");
    res
      .status(500)
      .json({
        message: "Error processing successful checkout",
        error: error.message,
      });
  }
};

async function createStripeCoupon(discountPercentage) {
  logger.debug({ discountPercentage }, "createStripeCoupon: Creating Stripe coupon");
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });

  logger.debug({ couponId: coupon.id, discountPercentage }, "createStripeCoupon: Stripe coupon created");
  return coupon.id;
}

async function createNewCoupon(userId) {
  logger.info({ userId }, "createNewCoupon: Creating new gift coupon for user");
  await Coupon.findOneAndDelete({ userId });

  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId: userId,
  });

  await newCoupon.save();
  
  await cacheSet(CacheKeys.userCoupon(userId.toString()), newCoupon, 1800);
  await cacheSet(CacheKeys.couponByCode(newCoupon.code), newCoupon, 1800);
  
  logger.info({ userId, couponCode: newCoupon.code, discountPercentage: newCoupon.discountPercentage }, "createNewCoupon: Gift coupon created successfully");

  return newCoupon;
}
