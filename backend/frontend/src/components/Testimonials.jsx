import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Fashion Enthusiast",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 5,
    text: "Amazing shopping experience! The quality of products is exceptional and delivery was super fast. Highly recommend!",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Style Blogger",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    rating: 5,
    text: "Found everything I was looking for. The website is easy to navigate and the product selection is impressive. Great prices too!",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Regular Customer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    rating: 5,
    text: "I've been shopping here for months and I'm always satisfied. The customer service is excellent and products are top-notch!",
  },
  {
    id: 4,
    name: "David Thompson",
    role: "Lifestyle Influencer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    rating: 5,
    text: "Best e-commerce platform I've used! Fast checkout, secure payments, and quality guaranteed. Will definitely shop again!",
  },
];

const Testimonials = () => {
  return (
    <section className="py-10 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            What Our Customers Say
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center mb-3">
                <div className="relative mr-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full border-2 border-primary-500 dark:border-primary-400"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary-500 dark:bg-primary-400 rounded-full p-1">
                    <Quote className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

