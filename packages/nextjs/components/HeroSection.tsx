"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <div className="hero min-h-[60vh] bg-base-200 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-secondary rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>

      <div className="hero-content text-center z-10">
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent"
          >
            Robotics eSports Platform
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="py-6 text-xl md:text-2xl font-light"
          >
            The future of autonomous competition. Verified on-chain.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-4 justify-center"
          >
            <Link href="/create" className="btn btn-primary btn-lg shadow-lg shadow-primary/30 hover:shadow-primary/50">
              Mint Robot
            </Link>
            <Link href="/marketplace" className="btn btn-outline btn-secondary btn-lg">
              Explore Market
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
