"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const examples = [
  {
    name: "Minotaur",
    type: "Drum Spinner",
    image: "/inspiration_1.png",
  },
  {
    name: "Witch Doctor",
    type: "Vertical Spinner",
    image: "/inspiration_2.png",
  },
  {
    name: "Hydra",
    type: "Flipper",
    image: "/inspiration_3.png",
  },
  {
    name: "Rotator",
    type: "Horizontal Spinner",
    image: "/inspiration_4.png",
  },
];

export const InspirationGallery = () => {
  return (
    <div className="py-10 border-t border-base-300 mt-10">
      <h3 className="text-2xl font-bold text-center mb-2">Inspiration Gallery</h3>
      <p className="text-center text-base-content/60 mb-8">See what others are building</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {examples.map((ex, idx) => (
          <Link href="https://opensea.io/collection/battlebot" key={idx} target="_blank" rel="noopener noreferrer">
            <motion.div
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
          </Link>
        ))}
      </div>
    </div>
  );
};
