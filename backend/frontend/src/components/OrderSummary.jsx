import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const stripePromise = loadStripe(
  "pk_test_51SPPykLC9RDBtLVr5rOcflJ2gpDWHE9uJ6nmMVb6gCa8uIVvqCT1tmNg7IDpZ7dSPcYZir89nEpamWm4VeD61o01004eE4BVrU"
);

const OrderSummary = () => {
  const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();

  const savings = subtotal - total;
  const formattedSubtotal = subtotal.toFixed(2);
  const formattedTotal = total.toFixed(2);
  const formattedSavings = savings.toFixed(2);

  const handlePayment = async () => {
    try {
      const stripe = await stripePromise;
      const res = await axios.post("/payments/create-checkout-session", {
        products: cart,
        couponCode: coupon ? coupon.code : null,
      });

      const session = res.data;
      toast.success("Redirecting to checkout...");
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to redirect to checkout");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to initiate checkout"
      );
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-soft dark:shadow-soft-dark sm:p-6 transition-all duration-300">
      <p className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">
        Order summary
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-medium text-gray-700 dark:text-gray-300">
              Original price
            </dt>
            <dd className="text-base font-bold text-gray-900 dark:text-white">
              ₹{formattedSubtotal}
            </dd>
          </dl>

          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-medium text-gray-700 dark:text-gray-300">
                Savings
              </dt>
              <dd className="text-base font-bold text-accent-600 dark:text-accent-400">
                -₹{formattedSavings}
              </dd>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-medium text-gray-700 dark:text-gray-300">
                Coupon ({coupon.code})
              </dt>
              <dd className="text-base font-bold text-accent-600 dark:text-accent-400">
                -{coupon.discountPercentage}%
              </dd>
            </dl>
          )}
          <dl className="flex items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <dt className="text-lg font-bold text-gray-900 dark:text-white">
              Total
            </dt>
            <dd className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">
              ₹{formattedTotal}
            </dd>
          </dl>
        </div>

        <button
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-700 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          onClick={handlePayment}
        >
          Proceed to Checkout
        </button>

        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-normal text-gray-400">or</span>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300 hover:no-underline transition-colors"
          >
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default OrderSummary;
