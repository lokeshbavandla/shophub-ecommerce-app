import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  CacheKeys,
} from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../lib/awsS3.js";
import { v4 as uuidv4 } from "uuid";
import logger from "../lib/logger.js";

// Cache TTL configuration for production performance optimization
// Different TTLs based on data volatility and update frequency
const CACHE_TTL = {
  PRODUCTS: 3600,
  FEATURED_PRODUCTS: 1800,
  RECOMMENDED_PRODUCTS: 1800,
  CATEGORY_PRODUCTS: 3600,
};

// Cache invalidation helper for maintaining data consistency
// Called after product mutations to ensure users see updated data
const invalidateProductCaches = async () => {
  logger.debug("invalidateProductCaches: Invalidating product caches");
  await Promise.all([
    cacheDel(CacheKeys.featuredProducts()),
    cacheDel(CacheKeys.allProducts()),
    cacheDel(CacheKeys.recommendedProducts()),
    cacheDelPattern("products:category:*"),
  ]);
  logger.debug("invalidateProductCaches: Product caches invalidated");
};

export const getAllProducts = async (req, res) => {
  logger.info("getAllProducts: Retrieving all products");
  try {
    const cachedProducts = await cacheGet(CacheKeys.allProducts());
    if (cachedProducts) {
      logger.debug("getAllProducts: Products found in Redis cache");
      return res.json(cachedProducts);
    }

    logger.debug(
      "getAllProducts: Products not in cache, fetching from MongoDB"
    );
    const products = await Product.find({}).lean();

    await cacheSet(CacheKeys.allProducts(), { products }, CACHE_TTL.PRODUCTS);

    logger.info(
      { productCount: products.length },
      "getAllProducts: Products retrieved successfully"
    );
    res.json({ products });
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "getAllProducts: Error retrieving products"
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  logger.info("getFeaturedProducts: Retrieving featured products");
  try {
    const cachedProducts = await cacheGet(CacheKeys.featuredProducts());
    if (cachedProducts) {
      logger.debug(
        "getFeaturedProducts: Featured products found in Redis cache"
      );
      return res.json(cachedProducts);
    }

    logger.debug(
      "getFeaturedProducts: Featured products not in cache, fetching from MongoDB"
    );
    const featuredProducts = await Product.find({ isFeatured: true }).lean();

    if (!featuredProducts || featuredProducts.length === 0) {
      logger.warn("getFeaturedProducts: No featured products found");
      return res.status(404).json({ message: "No featured products found" });
    }

    logger.debug(
      { productCount: featuredProducts.length },
      "getFeaturedProducts: Storing featured products in Redis cache"
    );
    await cacheSet(
      CacheKeys.featuredProducts(),
      featuredProducts,
      CACHE_TTL.FEATURED_PRODUCTS
    );

    logger.info(
      { productCount: featuredProducts.length },
      "getFeaturedProducts: Featured products retrieved successfully"
    );
    res.json(featuredProducts);
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "getFeaturedProducts: Error retrieving featured products"
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  logger.info(
    { name: req.body.name, category: req.body.category },
    "createProduct: Creating new product"
  );
  try {
    const { name, description, price, image, category } = req.body;

    let imageUrl = "";

    if (image) {
      logger.debug({ name }, "createProduct: Uploading image to S3");
      const base64Data = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      const type = image.split(";")[0].split("/")[1];
      const imageName = `${uuidv4()}.${type}`;

      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `products/${imageName}`,
        Body: base64Data,
        ContentType: `image/${type}`,
      };

      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      logger.debug(
        { imageName },
        "createProduct: Image uploaded to S3 successfully"
      );

      imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/products/${imageName}`;
    }

    logger.debug(
      { name, category, price, hasImage: !!imageUrl },
      "createProduct: Creating product in database"
    );
    const product = await Product.create({
      name,
      description,
      price,
      image: imageUrl,
      category,
    });

    await invalidateProductCaches();
    await cacheDel(CacheKeys.analyticsData());

    logger.info(
      { productId: product._id, name, category },
      "createProduct: Product created successfully"
    );
    res.status(201).json(product);
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack, name: req.body.name },
      "createProduct: Error creating product"
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  logger.info({ productId: req.params.id }, "deleteProduct: Deleting product");
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      logger.warn(
        { productId: req.params.id },
        "deleteProduct: Product not found"
      );
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      try {
        logger.debug(
          { productId: req.params.id },
          "deleteProduct: Deleting image from S3"
        );
        const imageUrl = new URL(product.image);
        const key = imageUrl.pathname.substring(1);

        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
        };

        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
        logger.info(
          { productId: req.params.id, key },
          "deleteProduct: Image deleted from AWS S3"
        );
      } catch (error) {
        logger.error(
          { error: error.message, productId: req.params.id },
          "deleteProduct: Error deleting image from AWS S3"
        );
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    await invalidateProductCaches();
    await cacheDel(CacheKeys.productById(req.params.id));
    await cacheDel(CacheKeys.analyticsData());

    logger.info(
      { productId: req.params.id },
      "deleteProduct: Product deleted successfully"
    );

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack, productId: req.params.id },
      "deleteProduct: Error deleting product"
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  logger.info(
    { productId: req.params.id, updates: Object.keys(req.body) },
    "updateProduct: Updating product"
  );
  try {
    const { id } = req.params;
    const { name, description, price, image, category, isFeatured } = req.body;

    // Find the existing product to get the old image URL
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      logger.warn({ productId: id }, "updateProduct: Product not found");
      return res.status(404).json({ message: "Product not found" });
    }

    let imageUrl = existingProduct.image;

    if (image && image.startsWith("data:image")) {
      logger.debug(
        { productId: id },
        "updateProduct: New image provided, updating image"
      );
      if (existingProduct.image) {
        try {
          const oldImageKey = new URL(existingProduct.image).pathname.substring(
            1
          );
          const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: oldImageKey,
          };
          await s3Client.send(new DeleteObjectCommand(deleteParams));
          logger.info(
            { productId: id, oldImageKey },
            "updateProduct: Old image deleted from AWS S3"
          );
        } catch (error) {
          logger.error(
            { error: error.message, productId: id },
            "updateProduct: Error deleting old image from AWS S3, continuing update..."
          );
        }
      }

      logger.debug(
        { productId: id },
        "updateProduct: Uploading new image to S3"
      );
      const base64Data = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const type = image.split(";")[0].split("/")[1];
      const imageName = `${uuidv4()}.${type}`;

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `products/${imageName}`,
        Body: base64Data,
        ContentType: `image/${type}`,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      logger.info(
        { productId: id, imageName },
        "updateProduct: New image uploaded to S3"
      );
      imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
    }

    logger.debug(
      { productId: id },
      "updateProduct: Updating product in database"
    );
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        image: imageUrl,
        category,
        isFeatured,
      },
      { new: true, runValidators: true }
    );

    await invalidateProductCaches();
    await cacheDel(CacheKeys.productById(id));

    logger.info(
      { productId: id, name: updatedProduct.name },
      "updateProduct: Product updated successfully"
    );
    res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack, productId: req.params.id },
      "updateProduct: Error updating product"
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  logger.info("getRecommendedProducts: Retrieving recommended products");
  try {
    const cachedProducts = await cacheGet(CacheKeys.recommendedProducts());
    if (cachedProducts) {
      logger.debug(
        "getRecommendedProducts: Recommended products found in Redis cache"
      );
      return res.json(cachedProducts);
    }

    logger.debug(
      "getRecommendedProducts: Recommended products not in cache, fetching from MongoDB"
    );
    const products = await Product.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    await cacheSet(
      CacheKeys.recommendedProducts(),
      products,
      CACHE_TTL.RECOMMENDED_PRODUCTS
    );

    logger.info(
      { productCount: products.length },
      "getRecommendedProducts: Recommended products retrieved successfully"
    );
    res.json(products);
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "getRecommendedProducts: Error retrieving recommended products"
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  logger.info(
    { category },
    "getProductsByCategory: Retrieving products by category"
  );
  try {
    const cacheKey = CacheKeys.productsByCategory(category);
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
      logger.debug(
        { category },
        "getProductsByCategory: Products found in Redis cache"
      );
      return res.json(cachedData);
    }

    logger.debug(
      { category },
      "getProductsByCategory: Products not in cache, fetching from MongoDB"
    );
    const products = await Product.find({ category }).lean();

    await cacheSet(cacheKey, { products }, CACHE_TTL.CATEGORY_PRODUCTS);

    logger.info(
      { category, productCount: products.length },
      "getProductsByCategory: Products retrieved successfully"
    );
    res.json({ products });
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack, category },
      "getProductsByCategory: Error retrieving products by category"
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  logger.info(
    { productId: req.params.id },
    "toggleFeaturedProduct: Toggling featured status"
  );
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const oldStatus = product.isFeatured;
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      logger.info(
        {
          productId: req.params.id,
          oldStatus,
          newStatus: updatedProduct.isFeatured,
        },
        "toggleFeaturedProduct: Featured status updated, invalidating caches"
      );

      await invalidateProductCaches();
      await cacheDel(CacheKeys.productById(req.params.id));

      logger.info(
        { productId: req.params.id },
        "toggleFeaturedProduct: Featured status toggled successfully"
      );
      res.json({ isFeatured: updatedProduct.isFeatured });
    } else {
      logger.warn(
        { productId: req.params.id },
        "toggleFeaturedProduct: Product not found"
      );
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack, productId: req.params.id },
      "toggleFeaturedProduct: Error toggling featured status"
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
