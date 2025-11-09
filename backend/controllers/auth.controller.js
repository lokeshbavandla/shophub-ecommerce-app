import { redis, cacheGet, cacheSet, cacheDel, CacheKeys } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import logger from "../lib/logger.js";

// Cache TTL configuration for user data
const CACHE_TTL = {
  USER_PROFILE: 1800,
};

const generateTokens = (userId) => {
  logger.debug({ userId }, "generateTokens: Generating tokens for user");
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  logger.debug("generateTokens: Tokens generated successfully");
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  logger.debug({ userId }, "storeRefreshToken: Storing refresh token in Redis");
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
  logger.debug({ userId }, "storeRefreshToken: Refresh token stored successfully");
};

// Cookie configuration for production security
// httpOnly: Prevents XSS attacks by blocking JavaScript access to cookies
// secure: Only sends cookies over HTTPS in production
// sameSite: Prevents CSRF attacks by restricting cross-site cookie usage
const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = async (req, res) => {
  logger.info({ email: req.body.email }, "signup: Starting user signup process");
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      logger.warn({ email }, "signup: User already exists");
      return res.status(400).json({ message: "User already exists" });
    }
    logger.debug({ email }, "signup: Creating new user");
    const user = await User.create({ name, email, password });
    logger.info({ userId: user._id, email }, "signup: User created successfully");

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    await cacheSet(CacheKeys.userProfile(user._id.toString()), userProfile, CACHE_TTL.USER_PROFILE);

    setCookies(res, accessToken, refreshToken);
    logger.info({ userId: user._id, email }, "signup: Signup completed successfully");

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, email }, "signup: Error during signup");
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  logger.info({ email: req.body.email }, "login: Starting user login process");
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      logger.info({ userId: user._id, email }, "login: User authenticated successfully");
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      
      const userProfile = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      await cacheSet(CacheKeys.userProfile(user._id.toString()), userProfile, CACHE_TTL.USER_PROFILE);
      
      setCookies(res, accessToken, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      logger.warn({ email }, "login: Invalid email or password");
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, email }, "login: Error during login");
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  logger.info("logout: Starting user logout process");
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const userId = decoded.userId.toString();
      logger.debug({ userId }, "logout: Deleting refresh token from Redis");
      await redis.del(`refresh_token:${userId}`);
      logger.debug({ userId }, "logout: Refresh token deleted from Redis");
      
      await cacheDel(CacheKeys.userProfile(userId));
      await cacheDel(CacheKeys.userCart(userId));
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    logger.info("logout: Logout completed successfully");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, "logout: Error during logout");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Token refresh endpoint for maintaining user sessions
// Allows clients to obtain new access tokens without re-authentication
export const refreshToken = async (req, res) => {
  logger.info("refreshToken: Starting token refresh process");
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.warn("refreshToken: No refresh token provided");
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    logger.debug({ userId: decoded.userId }, "refreshToken: Token verified, checking Redis");
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      logger.warn({ userId: decoded.userId }, "refreshToken: Invalid refresh token");
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    logger.debug({ userId: decoded.userId }, "refreshToken: Generating new access token");
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    logger.info({ userId: decoded.userId }, "refreshToken: Token refreshed successfully");
    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, "refreshToken: Error during token refresh");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  logger.info({ userId: req.user?._id }, "getProfile: Retrieving user profile");
  try {
    const userId = req.user._id.toString();
    const cacheKey = CacheKeys.userProfile(userId);
    
    const cachedProfile = await cacheGet(cacheKey);
    if (cachedProfile) {
      logger.debug({ userId }, "getProfile: Profile found in Redis cache");
      return res.json(cachedProfile);
    }

    const userProfile = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };
    
    await cacheSet(cacheKey, userProfile, CACHE_TTL.USER_PROFILE);
    
    logger.debug({ userId }, "getProfile: Profile retrieved successfully");
    res.json(userProfile);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: req.user?._id }, "getProfile: Error retrieving profile");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
