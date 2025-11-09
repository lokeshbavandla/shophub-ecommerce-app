import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { ShoppingCart } from "lucide-react";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";

const CartPage = () => {
  const { cart } = useCartStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 md:py-24">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        {cart.length > 0 && (
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Shopping Cart
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        )}
        <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
          <div className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl transition-opacity duration-300 ease-in">
            {cart.length === 0 ? (
              <EmptyCartUI />
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <CartItem key={item._id} item={item} />
                ))}
              </div>
            )}
            {cart.length > 0 && <PeopleAlsoBought />}
          </div>

          {cart.length > 0 && (
            <div className="mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full transition-opacity duration-300 ease-in">
              <OrderSummary />
              <GiftCouponCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CartPage;

const EmptyCartUI = () => (
  <div className="flex flex-col items-center justify-center space-y-4 py-16 transition-opacity duration-300 ease-in">
    <ShoppingCart className="h-24 w-24 text-gray-400 dark:text-gray-300" />
    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
      Your cart is empty
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      Looks like you {"haven't"} added anything to your cart yet.
    </p>
    <Link
      className="mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3 text-white font-semibold transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
      to="/"
    >
      Start Shopping
    </Link>
  </div>
);
