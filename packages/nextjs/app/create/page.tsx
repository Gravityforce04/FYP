"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RocketLaunchIcon, SparklesIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { InspirationGallery } from "~~/components/InspirationGallery";
import { ProcessSlideshow } from "~~/components/ProcessSlideshow";

const CreateLanding = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-24">
      <div className="px-5 w-full max-w-[85%]">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Create Your Robotic Legacy
            </h1>
            <p className="text-xl text-base-content/70 max-w-3xl mx-auto mb-8">
              Mint your autonomous robot as a unique NFT. Verify your competition results, prove ownership, and trade on
              the open market.
            </p>
            <Link
              href="/create/mint"
              className="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-primary/50 transition-all"
            >
              <RocketLaunchIcon className="w-6 h-6" />
              Mint Your Robot Now
            </Link>
          </motion.div>
        </div>

        {/* What is a Robotic NFT? - Curved Stack (Flexbox) */}
        <div className="mb-32 flex justify-between items-center w-full gap-8">
          {[
            {
              title: "Unique Identity",
              desc: "Each NFT represents a specific robot configuration with unique attributes and performance history.",
              icon: <SparklesIcon className="w-12 h-12 text-primary" />,
              color: "bg-primary/10",
              borderColor: "border-primary/20",
            },
            {
              title: "Verified Performance",
              desc: "Link your NFT to on-chain match results to prove your robot's capabilities and wins.",
              icon: <TrophyIcon className="w-12 h-12 text-secondary" />,
              color: "bg-secondary/10",
              borderColor: "border-secondary/20",
            },
            {
              title: "Tradeable Asset",
              desc: "Buy, sell, and trade your robots on the marketplace. High-performing robots gain value over time.",
              icon: <RocketLaunchIcon className="w-12 h-12 text-accent" />,
              color: "bg-accent/10",
              borderColor: "border-accent/20",
            },
          ].map((item, index) => {
            // Calculate rotation for "fan" effect
            const rotate = (index - 1) * 5; // -5, 0, 5

            return (
              <motion.div
                key={index}
                className={`card bg-base-100 shadow-2xl border ${item.borderColor} w-full h-96`}
                initial={{ y: 100, opacity: 0, rotate: 0 }}
                whileInView={{
                  y: Math.abs(index - 1) * 20, // Middle card higher (0), sides lower (20)
                  opacity: 1,
                  rotate: rotate,
                }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
              >
                <div className="card-body items-center text-center justify-center">
                  <div className={`w-24 h-24 rounded-full ${item.color} flex items-center justify-center mb-6`}>
                    {item.icon}
                  </div>
                  <h3 className="card-title text-3xl mb-4">{item.title}</h3>
                  <p className="text-lg opacity-80">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Inspiration Gallery */}
        <div className="mb-32">
          <InspirationGallery />
        </div>

        {/* Process Slideshow */}
        <div className="mb-32">
          <ProcessSlideshow />
        </div>

        {/* Bottom CTA */}
        <div className="text-center mb-20 bg-base-200 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Competition?</h2>
          <p className="text-lg text-base-content/70 mb-8">Start your journey by minting your first robot NFT today.</p>
          <Link href="/create/mint" className="btn btn-primary btn-wide">
            Start Minting
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateLanding;
