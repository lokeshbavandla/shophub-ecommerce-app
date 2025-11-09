import Coupon from "../models/coupon.model.js";
import { cacheGet, cacheSet, cacheDel, CacheKeys } from "../lib/redis.js";
import logger from "../lib/logger.js";

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  COUPON: 1800, // 30 minutes
};

export const getCoupon = async (req, res) => {
  logger.info({ userId: req.user._id }, "getCoupon: Retrieving user coupon");
  try {
    const userId = req.user._id.toString();
    const cacheKey = CacheKeys.userCoupon(userId);
    
    // Try to get from cache first
    const cachedCoupon = await cacheGet(cacheKey);
    if (cachedCoupon !== null) {
      logger.debug({ userId }, "getCoupon: Coupon found in Redis cache");
      return res.json(cachedCoupon);
    }

    // If not in cache, fetch from database
    logger.debug({ userId }, "getCoupon: Coupon not in cache, fetching from MongoDB");
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    }).lean();
    
    // Store in cache (even if null, with shorter TTL to avoid repeated DB queries)
    await cacheSet(cacheKey, coupon, CACHE_TTL.COUPON);
    
    logger.info({ userId, hasCoupon: !!coupon }, "getCoupon: Coupon retrieved successfully");
    res.json(coupon || null);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: req.user._id }, "getCoupon: Error retrieving coupon");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  logger.info({ userId: req.user._id, code: req.body.code }, "validateCoupon: Validating coupon code");
  try {
    const { code } = req.body;
    const userId = req.user._id.toString();
    const codeCacheKey = CacheKeys.couponByCode(code);
    
    // Try to get from cache first (by code)
    const cachedCoupon = await cacheGet(codeCacheKey);
    if (cachedCoupon) {
      // Check if it belongs to this user
      if (cachedCoupon.userId.toString() !== userId) {
        logger.warn({ userId, code }, "validateCoupon: Coupon not found (belongs to different user)");
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      // Check expiration
      if (new Date(cachedCoupon.expirationDate) < new Date()) {
        logger.warn({ userId, code, expirationDate: cachedCoupon.expirationDate }, "validateCoupon: Coupon expired");
        // Invalidate cache and mark as inactive
        await cacheDel(codeCacheKey);
        await cacheDel(CacheKeys.userCoupon(userId));
        await Coupon.findByIdAndUpdate(cachedCoupon._id, { isActive: false });
        return res.status(404).json({ message: "Coupon expired" });
      }
      
      logger.debug({ userId, code }, "validateCoupon: Coupon validated from cache");
      return res.json({
        message: "Coupon is valid",
        code: cachedCoupon.code,
        discountPercentage: cachedCoupon.discountPercentage,
      });
    }

    // If not in cache, fetch from database
    logger.debug({ userId, code }, "validateCoupon: Coupon not in cache, fetching from MongoDB");
    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user._id,
      isActive: true,
    }).lean();

    if (!coupon) {
      logger.warn({ userId, code }, "validateCoupon: Coupon not found");
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (new Date(coupon.expirationDate) < new Date()) {
      logger.warn({ userId, code, expirationDate: coupon.expirationDate }, "validateCoupon: Coupon expired");
      await Coupon.findByIdAndUpdate(coupon._id, { isActive: false });
      return res.status(404).json({ message: "Coupon expired" });
    }

    // Store in cache
    await cacheSet(codeCacheKey, coupon, CACHE_TTL.COUPON);
    await cacheSet(CacheKeys.userCoupon(userId), coupon, CACHE_TTL.COUPON);

    logger.info({ userId, code, discountPercentage: coupon.discountPercentage }, "validateCoupon: Coupon validated successfully");
    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: req.user._id, code: req.body.code }, "validateCoupon: Error validating coupon");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
