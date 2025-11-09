import { useEffect, useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import axios from "../lib/axios";
import {
  Users,
  Package,
  ShoppingCart,
  IndianRupee,
  Plus,
  Edit,
  Trash,
  Star,
} from "lucide-react";
import EditProductModal from "../components/EditProductModal";
import CreateProductModal from "../components/CreateProductModal";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const AdminPage = () => {
  const {
    products,
    fetchAllProducts,
    deleteProduct,
    toggleFeaturedProduct,
    loading,
  } = useProductStore();
  const [analyticsData, setAnalyticsData] = useState({
    users: 0,
    products: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchAnalyticsData = async () => {
    try {
      const response = await axios.get("/analytics");
      setAnalyticsData(response.data.analyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
    fetchAnalyticsData();
  }, [fetchAllProducts]);

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      await deleteProduct(productId);
      fetchAnalyticsData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your products and view analytics
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="mb-8">
          {isLoadingAnalytics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnalyticsCard
                title="Total Users"
                value={analyticsData.users.toLocaleString()}
                icon={Users}
                iconBg="bg-blue-500"
              />
              <AnalyticsCard
                title="Total Products"
                value={analyticsData.products.toLocaleString()}
                icon={Package}
                iconBg="bg-emerald-500"
              />
              <AnalyticsCard
                title="Total Sales"
                value={analyticsData.totalSales.toLocaleString()}
                icon={ShoppingCart}
                iconBg="bg-purple-500"
              />
              <AnalyticsCard
                title="Total Revenue"
                value={`₹${analyticsData.totalRevenue.toLocaleString()}`}
                icon={IndianRupee}
                iconBg="bg-orange-500"
              />
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Products Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Products
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {products?.length || 0} products in total
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Create Product
            </button>
          </div>

          {/* Products Table */}
          {loading && products.length === 0 ? (
            <div className="p-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : products?.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No products found. Create your first product!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {products?.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md line-clamp-2">
                          {product.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{product.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={async () => {
                            await toggleFeaturedProduct(product._id);
                            fetchAnalyticsData();
                          }}
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                            product.isFeatured
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                          title={
                            product.isFeatured
                              ? "Remove from featured"
                              : "Mark as featured"
                          }
                        >
                          <Star
                            className={`h-5 w-5 ${
                              product.isFeatured ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Edit product"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(product._id, product.name)
                            }
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete product"
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchAllProducts();
          fetchAnalyticsData();
        }}
      />

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => {
            setEditingProduct(null);
            fetchAllProducts();
            fetchAnalyticsData();
          }}
        />
      )}
    </div>
  );
};

const AnalyticsCard = ({ title, value, icon: Icon, iconBg }) => (
  <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </h3>
      </div>
      <div className={`p-3 rounded-lg ${iconBg} text-white`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

export default AdminPage;
