"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const examples = [
  {
    name: "Speedster X1",
    type: "Racing Drone",
    image: "https://images.unsplash.com/photo-1506947411487-a56738267384?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Tank-Bot Prime",
    type: "Battle Bot",
    image: "https://images.unsplash.com/photo-1535378437327-b7128d611d4a?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Navi-AI Core",
    type: "Navigation Module",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Cyber-Arm V2",
    type: "Utility Part",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&auto=format&fit=crop",
  },
];

export const InspirationGallery = () => {
  return (
    <div className="py-10 border-t border-base-300 mt-10">
      <h3 className="text-2xl font-bold text-center mb-2">Inspiration Gallery</h3>
      <p className="text-center text-base-content/60 mb-8">See what others are building</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {examples.map((ex, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05 }}
            className="relative group rounded-xl overflow-hidden shadow-lg h-48"
          >
            <Image
              src={ex.image}
              alt={ex.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <span className="text-white font-bold">{ex.name}</span>
              <span className="text-white/70 text-xs">{ex.type}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
