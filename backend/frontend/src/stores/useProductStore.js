import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),
  createProduct: async (productData) => {
    set({ loading: true });
    try {
      await axios.post("/products", productData);
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
      toast.success("Product created successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create product");
      set({ loading: false });
    }
  },
  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to fetch products");
    }
  },
  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const response = await axios.get(`/products/category/${category}`);
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to fetch products");
    }
  },
  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`);
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
      toast.success("Product deleted successfully!");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Failed to delete product");
    }
  },
  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/products/${productId}`);
      const isFeatured = response.data.isFeatured;
      const productsResponse = await axios.get("/products");
      set({ products: productsResponse.data.products, loading: false });
      toast.success(
        isFeatured
          ? "Product marked as featured!"
          : "Product removed from featured!"
      );
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Failed to update product");
    }
  },
  updateProduct: async (productId, productData) => {
    set({ loading: true });
    try {
      await axios.put(`/products/${productId}`, productData);
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
      toast.success("Product updated successfully");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Failed to update product");
    }
  },
  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products/featured");
      set({ products: response.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      console.log("Error fetching featured products:", error);
    }
  },
  fetchRecommendedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products/recommendations");
      set({ products: response.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch recommended products", loading: false });
      console.log("Error fetching recommended products:", error);
    }
  },
}));
