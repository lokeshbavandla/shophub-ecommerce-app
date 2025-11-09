import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PurchaseCancelPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative z-10">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="text-red-600 dark:text-red-400 w-12 h-12" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Purchase Cancelled
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Your order has been cancelled. No charges have been made.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              If you encountered any issues during the checkout process, please
              don&apos;t hesitate to contact our support team.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to={"/"}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="mr-2" size={18} />
              Return to Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCancelPage;
