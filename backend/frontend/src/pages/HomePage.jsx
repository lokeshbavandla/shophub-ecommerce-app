import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, Sparkles, TrendingUp, Award, Zap } from "lucide-react";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import ProductsSlider from "../components/ProductsSlider";
import Testimonials from "../components/Testimonials";
import axios from "../lib/axios";

const categories = [
  { href: "/jeans", name: "Jeans", imageUrl: "/jeans.jpg" },
  { href: "/t-shirts", name: "T-shirts", imageUrl: "/tshirts.jpg" },
  { href: "/shoes", name: "Shoes", imageUrl: "/shoes.jpg" },
  { href: "/glasses", name: "Glasses", imageUrl: "/glasses.png" },
  { href: "/jackets", name: "Jackets", imageUrl: "/jackets.jpg" },
  { href: "/suits", name: "Suits", imageUrl: "/suits.jpg" },
  { href: "/bags", name: "Bags", imageUrl: "/bags.jpg" },
];

const HomePage = () => {
  const {
    fetchFeaturedProducts,
    products: featuredProducts,
    loading: featuredLoading,
  } = useProductStore();

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      setRecommendedLoading(true);
      try {
        const response = await axios.get("/products/recommendations");
        setRecommendedProducts(response.data);
      } catch (error) {
        console.error("Error fetching recommended products:", error);
      } finally {
        setRecommendedLoading(false);
      }
    };

    fetchFeaturedProducts();
    fetchRecommended();
  }, [fetchFeaturedProducts]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10 overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 dark:bg-primary-900 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-200 dark:bg-accent-900 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full mb-4 shadow-md">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Premium Quality Products
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-400 dark:via-primary-300 dark:to-accent-400 bg-clip-text text-transparent">
                Discover Your Style
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed">
              Explore our curated collection of premium fashion and lifestyle products.
              Shop the latest trends with quality guaranteed.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a
                href="#categories"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <ShoppingBag className="w-5 h-5" />
                Shop Now
              </a>
              <a
                href="#featured"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-all duration-300"
              >
                Explore Featured
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="featured" className="py-12 bg-white dark:bg-gray-900">
        <ProductsSlider
          products={featuredProducts}
          title="Featured Products"
          isLoading={featuredLoading}
        />
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Shop by Category
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Browse our extensive collection across different categories
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryItem key={category.name} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Products Section */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <ProductsSlider
          products={recommendedProducts}
          title="Recommended for You"
          isLoading={recommendedLoading}
        />
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Why Choose Us
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience the best in online shopping
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                Fast Delivery
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Get your orders delivered quickly and safely with our reliable shipping partners.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                Premium Quality
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                We source only the finest products to ensure you get the best value for your money.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                Best Prices
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Competitive pricing with regular deals and discounts to save you money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Call to Action Section */}
      <section className="py-12 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Ready to Start Shopping?
          </h2>
          <p className="text-lg text-primary-100 mb-6">
            Join thousands of satisfied customers and discover your perfect style today.
          </p>
          <a
            href="#categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <ShoppingBag className="w-5 h-5" />
            Start Shopping Now
          </a>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
