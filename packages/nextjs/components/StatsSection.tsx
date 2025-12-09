"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Active Robots", value: "12", color: "text-primary" },
  { label: "Matches Recorded", value: "45", color: "text-secondary" },
  { label: "Total Volume", value: "2.5 ETH", color: "text-accent" },
];

export const StatsSection = () => {
  return (
    <div className="py-12 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-base-200/50 backdrop-blur-sm border border-base-300"
            >
              <div className={`text-4xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
              <div className="text-base-content/70 uppercase tracking-wider text-sm font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
