import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CategoryItem = ({ category }) => {
  return (
    <Link
      to={"/category" + category.href}
      className="group relative overflow-hidden h-80 sm:h-96 w-full rounded-2xl shadow-soft dark:shadow-soft-dark hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10 dark:from-primary-400/20 dark:to-accent-400/20 z-10" />
      <img
        src={category.imageUrl}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-125"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
          {category.name}
        </h3>
        <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors">
          <span className="text-sm font-medium">Explore Collection</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default CategoryItem;
