import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCartStore();

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
        <div className="shrink-0 md:order-1">
          <img 
            className="h-20 w-20 md:h-32 md:w-32 rounded-lg object-cover ring-2 ring-gray-100 dark:ring-gray-700" 
            src={item.image} 
            alt={item.name}
          />
        </div>
        <label className="sr-only">Choose quantity:</label>

        <div className="flex items-center justify-between gap-4 md:order-3 md:justify-end">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all duration-200 active:scale-95"
              onClick={() => updateQuantity(item._id, item.quantity - 1)}
            >
              <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </button>
            <p className="text-base font-semibold text-gray-900 dark:text-white min-w-[2rem] text-center">
              {item.quantity}
            </p>
            <button
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all duration-200 active:scale-95"
              onClick={() => updateQuantity(item._id, item.quantity + 1)}
            >
              <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          <div className="text-end md:order-4 md:w-32">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              ₹{item.price.toFixed(2)} each
            </p>
            <p className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
              ₹{(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-3 md:order-2 md:max-w-md">
          <p className="text-lg font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
            {item.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {item.description}
          </p>

          <div className="flex items-center gap-4 pt-2">
            <button
              className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              onClick={() => removeFromCart(item._id)}
            >
              <Trash className="h-4 w-4" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CartItem;
