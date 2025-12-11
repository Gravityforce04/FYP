"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CurrencyDollarIcon, DocumentTextIcon, RocketLaunchIcon, WalletIcon } from "@heroicons/react/24/outline";

export const ProcessSlideshow = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Connect Wallet",
      desc: "Link your crypto wallet to start interacting with the blockchain. We support MetaMask, Rainbow, and more.",
      icon: <WalletIcon className="w-12 h-12" />,
      image: "/inspiration_2.png",
    },
    {
      title: "Enter Details",
      desc: "Provide your robot's specifications, history, and upload a high-quality image. This data becomes immutable.",
      icon: <DocumentTextIcon className="w-12 h-12" />,
      image: "/inspiration_3.png",
    },
    {
      title: "Mint NFT",
      desc: "Confirm the transaction to mint your robot as a unique NFT on the Arbitrum network.",
      icon: <RocketLaunchIcon className="w-12 h-12" />,
      image: "/inspiration_1.png",
    },
    {
      title: "List for Sale",
      desc: "Set your price and list your robot on the marketplace for others to discover and purchase.",
      icon: <CurrencyDollarIcon className="w-12 h-12" />,
      image: "/inspiration_4.png",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>

      <div className="grid lg:grid-cols-12 gap-8 h-[500px]">
        {/* Steps Navigation */}
        <div className="lg:col-span-4 flex flex-col justify-center gap-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${
                activeStep === index
                  ? "bg-primary text-primary-content border-primary shadow-lg scale-105"
                  : "bg-base-100 hover:bg-base-200 border-base-200"
              }`}
              onClick={() => setActiveStep(index)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${activeStep === index ? "bg-white/20" : "bg-base-300"}`}>
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Active Step Content */}
        <div className="lg:col-span-8 relative bg-base-100 rounded-3xl overflow-hidden shadow-2xl border border-base-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="h-2/3 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-base-100 to-transparent z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={steps[activeStep].image}
                  alt={steps[activeStep].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-1/3 p-8 flex items-start gap-6 relative z-20 -mt-10">
                <div className="p-4 bg-primary text-primary-content rounded-2xl shadow-lg">
                  {steps[activeStep].icon}
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2">{steps[activeStep].title}</h3>
                  <p className="text-lg opacity-80">{steps[activeStep].desc}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
