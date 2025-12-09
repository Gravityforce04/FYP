"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface CompetitionCardProps {
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent";
}

export const CompetitionCard = ({ title, description, link, icon, color }: CompetitionCardProps) => {
  const colorClasses = {
    primary: "border-primary shadow-primary/20 hover:shadow-primary/40",
    secondary: "border-secondary shadow-secondary/20 hover:shadow-secondary/40",
    accent: "border-accent shadow-accent/20 hover:shadow-accent/40",
  };

  return (
    <Link href={link} className="block w-full max-w-sm">
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className={`card bg-base-200 border-2 ${colorClasses[color]} shadow-lg transition-all duration-300 h-full`}
      >
        <div className="card-body items-center text-center">
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className={`p-4 rounded-full bg-base-300 mb-2 text-${color}`}
          >
            {icon}
          </motion.div>
          <h2 className="card-title text-2xl font-bold mb-2">{title}</h2>
          <p className="text-base-content/80">{description}</p>
          <div className="card-actions justify-end mt-4">
            <button className={`btn btn-${color} btn-outline btn-sm`}>Enter</button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
