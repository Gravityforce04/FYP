"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const slides = [
  {
    id: 1,
    title: "Global Autonomous Drone League 2025",
    description: "Compete for a 50 ETH prize pool in the world's premier drone racing event.",
    image: "https://images.unsplash.com/photo-1506947411487-a56738267384?q=80&w=2000&auto=format&fit=crop",
    link: "/competition/drone-league-2025",
    color: "from-primary/80 to-primary/20",
  },
  {
    id: 2,
    title: "BattleBots: Heavyweight Championship",
    description: "The titans of steel clash this weekend. Watch live or participate in the prediction markets.",
    image: "https://images.unsplash.com/photo-1535378437327-b7128d611d4a?q=80&w=2000&auto=format&fit=crop",
    link: "/competition/battlebots-heavyweight",
    color: "from-secondary/80 to-secondary/20",
  },
  {
    id: 3,
    title: "AI Navigation Hackathon",
    description: "Build the smartest pathfinding algorithm and win exclusive NFT parts.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2000&auto=format&fit=crop",
    link: "/hackathon/ai-nav",
    color: "from-accent/80 to-accent/20",
  },
];

export const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-3xl shadow-2xl mb-12 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-base-300">
            <Image
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].color} mix-blend-multiply opacity-60`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent opacity-90" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 p-12 w-full md:w-2/3 lg:w-1/2 z-10">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg"
            >
              {slides[currentSlide].title}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-white/90 mb-8 drop-shadow-md"
            >
              {slides[currentSlide].description}
            </motion.p>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <Link
                href={slides[currentSlide].link}
                className="btn btn-primary btn-lg border-none shadow-lg hover:scale-105 transition-transform"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-8 right-8 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index ? "bg-white w-8" : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
