import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import LoadingSpinner from "./LoadingSpinner";

const ProductsSlider = ({ products, title, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

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
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, products.length - itemsPerPage);
      return Math.min(prevIndex + itemsPerPage, maxIndex);
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - itemsPerPage));
  };

  const isStartDisabled = currentIndex === 0;
  const isEndDisabled = currentIndex >= products.length - itemsPerPage;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          {title}
        </h2>
        <LoadingSpinner />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
        <span className="bg-gradient-to-r from-primary-600 to-accent-500 dark:from-primary-400 dark:to-accent-400 bg-clip-text text-transparent">
          {title}
        </span>
      </h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
              }}
            >
              {products.map((product) => (
                <div
                  key={product._id}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / itemsPerPage}%` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {products.length > itemsPerPage && (
            <>
              <button
                onClick={prevSlide}
                disabled={isStartDisabled}
                className={`absolute top-1/2 -left-12 sm:-left-16 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 shadow-lg z-10 ${
                  isStartDisabled
                    ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-xl"
                }`}
                aria-label="Previous products"
              >
                <ChevronLeft
                  className={`w-6 h-6 ${
                    isStartDisabled
                      ? "text-gray-400"
                      : "text-primary-600 dark:text-primary-400"
                  }`}
                />
              </button>

              <button
                onClick={nextSlide}
                disabled={isEndDisabled}
                className={`absolute top-1/2 -right-12 sm:-right-16 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 shadow-lg z-10 ${
                  isEndDisabled
                    ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-xl"
                }`}
                aria-label="Next products"
              >
                <ChevronRight
                  className={`w-6 h-6 ${
                    isEndDisabled
                      ? "text-gray-400"
                      : "text-primary-600 dark:text-primary-400"
                  }`}
                />
              </button>
            </>
          )}
        </div>
      </div>
  );
};

export default ProductsSlider;

