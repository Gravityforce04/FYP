"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon, CubeTransparentIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export const BlockchainScanner101 = () => {
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    { text: "Initiating Scan...", color: "text-base-content" },
    { text: "Verifying Block Hash...", color: "text-warning" },
    { text: "Checking Merkle Root...", color: "text-info" },
    { text: "Validating Signatures...", color: "text-accent" },
    { text: "Consensus Reached!", color: "text-success" },
  ];

  useEffect(() => {
    if (scanning) {
      const interval = setInterval(() => {
        setStep(prev => {
          if (prev >= steps.length - 1) {
            setScanning(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [scanning, steps.length]);

  const startScan = () => {
    setStep(0);
    setScanning(true);
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
      <div className="card-body">
        <h3 className="card-title text-2xl mb-4 flex items-center gap-2">
          <CubeTransparentIcon className="w-8 h-8 text-primary" />
          Blockchain Scanner 101
        </h3>
        <p className="mb-6 text-base-content/70">
          Understand how our decentralized network verifies every match result. Click scan to simulate the validation
          process.
        </p>

        <div className="relative h-48 bg-base-300 rounded-xl overflow-hidden flex items-center justify-center mb-6">
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(#4a4a4a 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          ></div>

          {/* Scanner Line */}
          {scanning && (
            <motion.div
              initial={{ top: 0 }}
              animate={{ top: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10"
            />
          )}

          {/* Status Text */}
          <motion.div
            key={step}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-2xl font-bold ${steps[step].color} flex items-center gap-2 z-20 bg-base-100/80 px-6 py-3 rounded-full backdrop-blur-sm`}
          >
            {step === steps.length - 1 ? (
              <CheckCircleIcon className="w-6 h-6" />
            ) : (
              <MagnifyingGlassIcon className="w-6 h-6 animate-pulse" />
            )}
            {steps[step].text}
          </motion.div>
        </div>

        <div className="card-actions justify-end">
          <button className={`btn btn-primary ${scanning ? "loading" : ""}`} onClick={startScan} disabled={scanning}>
            {scanning ? "Scanning Network..." : "Simulate Validation"}
          </button>
        </div>
      </div>
    </div>
  );
};
