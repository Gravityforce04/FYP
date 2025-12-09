"use client";

import { motion } from "framer-motion";
import { ClipboardDocumentCheckIcon, CloudArrowUpIcon, CurrencyDollarIcon, TagIcon } from "@heroicons/react/24/outline";

const steps = [
  {
    id: 1,
    title: "Verify Match",
    description: "Enter a valid Match ID to prove your robot's performance.",
    icon: <ClipboardDocumentCheckIcon className="w-8 h-8" />,
    color: "bg-primary",
  },
  {
    id: 2,
    title: "Upload Assets",
    description: "Upload your robot's image and configure metadata.",
    icon: <CloudArrowUpIcon className="w-8 h-8" />,
    color: "bg-secondary",
  },
  {
    id: 3,
    title: "Mint NFT",
    description: "Create your unique token on the blockchain.",
    icon: <TagIcon className="w-8 h-8" />,
    color: "bg-accent",
  },
  {
    id: 4,
    title: "List for Sale",
    description: "Set a price and list it on the marketplace.",
    icon: <CurrencyDollarIcon className="w-8 h-8" />,
    color: "bg-success",
  },
];

export const HowToListGuide = () => {
  return (
    <div className="py-10">
      <h3 className="text-2xl font-bold text-center mb-8">How to Create & List</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="card-body items-center text-center">
              <div className={`p-4 rounded-full ${step.color} text-white mb-2 shadow-lg`}>{step.icon}</div>
              <h4 className="card-title text-lg">{step.title}</h4>
              <p className="text-sm text-base-content/70">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
