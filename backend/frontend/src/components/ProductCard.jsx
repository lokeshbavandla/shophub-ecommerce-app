import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const ProductCard = ({ product }) => {
  const { user } = useUserStore();
  const { addToCart } = useCartStore();
  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add products to cart", { id: "login" });
      return;
    } else {
      // add to cart
      addToCart(product);
    }
  };

  return (
    <div className="group flex w-full relative flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-soft dark:shadow-soft-dark hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative mx-4 mt-4 flex h-60 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
        <img
          className="object-cover w-full transition-transform duration-500 group-hover:scale-110"
          src={product.image}
          alt={product.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="mt-4 px-5 pb-5">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 line-clamp-2">
          {product.name}
        </h5>
        <div className="mt-2 mb-5 flex items-center justify-between">
          <p>
            <span className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">
              ₹{product.price.toFixed(2)}
            </span>
          </p>
        </div>
        <button
          className="w-full flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
          onClick={handleAddToCart}
        >
          <ShoppingCart size={20} className="mr-2" />
          Add to cart
        </button>
      </div>
    </div>
  );
};
export default ProductCard;
