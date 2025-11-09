import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { cacheGet, cacheSet, CacheKeys } from "../lib/redis.js";
import logger from "../lib/logger.js";

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  ANALYTICS: 900, // 15 minutes
  DAILY_SALES: 1800, // 30 minutes
};

export const getAnalyticsData = async () => {
  logger.info("getAnalyticsData: Starting analytics data retrieval");
  
  // Try to get from cache first
  const cachedData = await cacheGet(CacheKeys.analyticsData());
  if (cachedData) {
    logger.debug("getAnalyticsData: Analytics data found in Redis cache");
    return cachedData;
  }

  // If not in cache, fetch from database
  logger.debug("getAnalyticsData: Analytics data not in cache, fetching from MongoDB");
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  
  logger.debug({ totalUsers, totalProducts }, "getAnalyticsData: Counted users and products");

  const salesData = await Order.aggregate([
    {
      $group: {
        _id: null, // it groups all documents together,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const { totalSales, totalRevenue } = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };

  logger.info({ totalSales, totalRevenue }, "getAnalyticsData: Retrieved sales data");
  
  const result = {
    users: totalUsers,
    products: totalProducts,
    totalSales,
    totalRevenue,
  };
  
  // Store in cache for future quick access
  await cacheSet(CacheKeys.analyticsData(), result, CACHE_TTL.ANALYTICS);
  
  logger.info("getAnalyticsData: Analytics data retrieval completed successfully");
  return result;
};

export const getDailySalesData = async (startDate, endDate) => {
  logger.info({ startDate, endDate }, "getDailySalesData: Starting daily sales data retrieval");
  try {
    // Create cache key from date range
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const cacheKey = CacheKeys.dailySalesData(startDateStr, endDateStr);
    
    // Try to get from cache first
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
      logger.debug({ startDate, endDate }, "getDailySalesData: Daily sales data found in Redis cache");
      return cachedData;
    }

    // If not in cache, fetch from database
    logger.debug({ startDate, endDate }, "getDailySalesData: Daily sales data not in cache, fetching from MongoDB");
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // example of dailySalesData
    // [
    // 	{
    // 		_id: "2024-08-18",
    // 		sales: 12,
    // 		revenue: 1450.75
    // 	},
    // ]

    const dateArray = getDatesInRange(startDate, endDate);
    logger.debug({ dateCount: dateArray.length }, "getDailySalesData: Generated date range");
    
    const result = dateArray.map((date) => {
      const foundData = dailySalesData.find((item) => item._id === date);

      return {
        date,
        sales: foundData?.sales || 0,
        revenue: foundData?.revenue || 0,
      };
    });
    
    // Store in cache for future quick access
    await cacheSet(cacheKey, result, CACHE_TTL.DAILY_SALES);
    
    logger.info({ recordCount: result.length }, "getDailySalesData: Daily sales data retrieved successfully");
    return result;
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, "getDailySalesData: Error retrieving daily sales data");
    throw error;
  }
};

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
