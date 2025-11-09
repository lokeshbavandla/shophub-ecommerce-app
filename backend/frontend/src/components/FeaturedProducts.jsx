import { useEffect, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const FeaturedProducts = ({ featuredProducts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  const { addToCart } = useCartStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerPage(1);
      else if (window.innerWidth < 1024) setItemsPerPage(2);
      else if (window.innerWidth < 1280) setItemsPerPage(3);
      else setItemsPerPage(4);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
  };

  const isStartDisabled = currentIndex === 0;
  const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${
                  currentIndex * (100 / itemsPerPage)
                }%)`,
              }}
            >
              {featuredProducts?.map((product) => (
                <div
                  key={product._id}
                  className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-3"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden h-full transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl border border-gray-200 dark:border-gray-700 transform hover:-translate-y-2 group">
                    <div className="overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent mb-4">
                        ₹{product.price.toFixed(2)}
                      </p>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={prevSlide}
            disabled={isStartDisabled}
            className={`absolute top-1/2 -left-12 sm:-left-16 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 shadow-lg ${
              isStartDisabled
                ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-xl"
            }`}
            aria-label="Previous products"
          >
            <ChevronLeft className={`w-6 h-6 ${isStartDisabled ? 'text-gray-400' : 'text-primary-600 dark:text-primary-400'}`} />
          </button>

          <button
            onClick={nextSlide}
            disabled={isEndDisabled}
            className={`absolute top-1/2 -right-12 sm:-right-16 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 shadow-lg ${
              isEndDisabled
                ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-xl"
            }`}
            aria-label="Next products"
          >
            <ChevronRight className={`w-6 h-6 ${isEndDisabled ? 'text-gray-400' : 'text-primary-600 dark:text-primary-400'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default FeaturedProducts;
