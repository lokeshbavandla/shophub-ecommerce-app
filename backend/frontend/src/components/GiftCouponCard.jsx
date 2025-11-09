import { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";

const GiftCouponCard = () => {
  const [userInputCode, setUserInputCode] = useState("");
  const { coupon, isCouponApplied, applyCoupon, getMyCoupon, removeCoupon } =
    useCartStore();

  useEffect(() => {
    getMyCoupon();
  }, [getMyCoupon]);

  useEffect(() => {
    if (coupon) {
      setUserInputCode(coupon.code);
    }
  }, [coupon]);

  const handleApplyCoupon = async (code) => {
    if (!code) return;
    await applyCoupon(code);
    setUserInputCode(code);
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setUserInputCode("");
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm sm:p-6 transition-all duration-300 hover:shadow-md">
      {/* Manual Code Input Section */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="voucher"
            className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100"
          >
            Enter coupon code
          </label>
          <input
            type="text"
            id="voucher"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 
            p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 
            focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all duration-200"
            placeholder="Enter code here"
            value={userInputCode}
            onChange={(e) => setUserInputCode(e.target.value)}
          />
        </div>

        {isCouponApplied && coupon ? (
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-700 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            onClick={handleRemoveCoupon}
          >
            Remove Coupon
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-700 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            onClick={() => handleApplyCoupon(userInputCode)}
            disabled={!userInputCode}
          >
            Apply Code
          </button>
        )}
      </div>
    </div>
  );
};
export default GiftCouponCard;
