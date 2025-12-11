"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { HeroSlideshow } from "~~/components/HeroSlideshow";

const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: spacerRef,
    offset: ["start start", "end end"],
  });

  // Smooth scroll progress
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // --- Animation Stages (Total 800vh) ---
  // 0.0 - 0.15: Robot Hero (Full Screen)
  // 0.15 - 0.35: Robot Shrinks Left + NFT Enters Right (Split View)
  // 0.35 - 0.45: Both Fade Out
  // 0.45 - 0.6: Problem Statement
  // 0.6 - 0.75: Solution Statement
  // 0.75 - 0.9: Quote
  // 0.9 - 1.0: Main Content Reveal

  // 1. Fighting Robot
  const robotScale = useTransform(smoothProgress, [0, 0.25, 0.5], [1.2, 0.8, 0.8]);
  const robotX = useTransform(smoothProgress, [0, 0.25, 0.5], ["0%", "-25%", "-25%"]);
  const robotOpacity = useTransform(smoothProgress, [0.5, 0.6], [1, 0]);

  // 2. NFT (Right)
  const nftOpacity = useTransform(smoothProgress, [0.2, 0.3, 0.5, 0.6], [0, 1, 1, 0]);
  const nftX = useTransform(smoothProgress, [0.2, 0.3, 0.5], ["25%", "25%", "25%"]);
  const plusOpacity = useTransform(smoothProgress, [0.25, 0.35, 0.45], [0, 1, 0]);

  // 3. Problem
  const problemY = useTransform(smoothProgress, [0.5, 0.57, 0.7], [100, 0, -100]);
  const problemOpacity = useTransform(smoothProgress, [0.5, 0.57, 0.7], [0, 1, 0]);

  // 4. Solution
  const solutionY = useTransform(smoothProgress, [0.7, 0.75, 0.85], [100, 0, -100]);
  const solutionOpacity = useTransform(smoothProgress, [0.7, 0.75, 0.85], [0, 1, 0]);

  // 5. Quote
  const quoteScale = useTransform(smoothProgress, [0.85, 0.9, 0.95], [0.8, 1, 1.2]);
  const quoteOpacity = useTransform(smoothProgress, [0.85, 0.9, 0.95], [0, 1, 0]);

  // 6. Main Content
  const mainContentY = useTransform(smoothProgress, [0.9, 1.0], [100, 0]);
  const mainContentOpacity = useTransform(smoothProgress, [0.9, 1.0], [0, 1]);

  // Mock news data
  const newsItems = [
    {
      title: "BattleBots Destruct-A-Thon",
      date: "Dec 13, 2024",
      category: "Event",
      image: "https://battlebots.com/wp-content/uploads/2024/07/bb-logo-1.png",
      desc: "Witness the destruction live at the BattleBots Destruct-A-Thon. Experience the intensity of robot combat firsthand.",
      link: "https://battlebots.com/event/battlebots-destruct-a-thon-saturday-12-13-2pm/",
    },
    {
      title: "Robot Combat Events",
      date: "Ongoing",
      category: "Community",
      image: "http://robotcombatevents.com/assets/rce_logo-82a8a810f43b3b4a36275d3122c601e3.png",
      desc: "Find upcoming robot combat events near you. Join the global community of builders and fighters.",
      link: "http://robotcombatevents.com/",
    },
    {
      title: "Builders Database Events",
      date: "Upcoming",
      category: "Registration",
      image: "https://www.buildersdb.com/img/logo.png",
      desc: "Register for the latest robot combat tournaments and meetups. Track your rankings and event history.",
      link: "https://www.buildersdb.com/events/1491",
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Scrollytelling Container - Sticky */}
      {/* Increased height to 800vh */}
      <div ref={spacerRef} className="h-[800vh] relative">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          {/* 1. Fighting Robot */}
          <motion.div
            style={{ scale: robotScale, x: robotX, opacity: robotOpacity }}
            className="absolute w-full h-full flex items-center justify-center pointer-events-none"
          >
            <div className="relative w-[800px] h-[600px]">
              {/* Faded Border Effect using mask-image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/robotics_hero.jpg" alt="Fighting Robot" className="w-full h-full object-contain" />
              <div className="absolute top-10 left-0 right-0 text-center">
                <p className="text-4xl font-black text-white tracking-widest drop-shadow-2xl uppercase">Robotics</p>
              </div>
            </div>
          </motion.div>

          {/* 2. Plus Symbol */}
          <motion.div style={{ opacity: plusOpacity }} className="absolute z-10 pointer-events-none">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
              <span className="text-6xl font-black text-black pb-2">+</span>
            </div>
          </motion.div>

          {/* 3. NFT (Right) */}
          <motion.div
            style={{ opacity: nftOpacity, x: nftX }}
            className="absolute w-full h-full flex items-center justify-center pointer-events-none"
          >
            <div className="relative w-[600px] h-[600px] flex items-center justify-center">
              {/* Faded Border Effect */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/blockchain_hero.jpg" alt="Blockchain Technology" className="w-full h-full object-contain" />
              <div className="absolute top-10 left-0 right-0 text-center">
                <p className="text-4xl font-black text-white tracking-widest drop-shadow-2xl uppercase">Blockchain</p>
              </div>
            </div>
          </motion.div>

          {/* 4. Problem */}
          <motion.div
            style={{ y: problemY, opacity: problemOpacity }}
            className="absolute max-w-4xl px-8 text-center z-20 pointer-events-none"
          >
            <h2 className="text-6xl md:text-8xl font-black mb-12 text-purple-500 tracking-tighter drop-shadow-2xl">
              THE PROBLEM
            </h2>
            <p className="text-4xl md:text-5xl font-bold leading-relaxed drop-shadow-xl">
              Competitions are <span className="text-cyan-400">centralized</span>. <br />
              History is <span className="text-cyan-400">forgotten</span>. <br />
              Effort is <span className="text-cyan-400">unrewarded</span>.
            </p>
          </motion.div>

          {/* 5. Solution */}
          <motion.div
            style={{ y: solutionY, opacity: solutionOpacity }}
            className="absolute max-w-4xl px-8 text-center z-20 pointer-events-none"
          >
            <h2 className="text-6xl md:text-8xl font-black mb-12 text-purple-500 tracking-tighter drop-shadow-2xl">
              THE SOLUTION
            </h2>
            <p className="text-4xl md:text-5xl font-bold leading-relaxed drop-shadow-xl">
              <span className="text-cyan-400">Immutable</span> Match Records. <br />
              <span className="text-cyan-400">Verifiable</span> Ownership. <br />
              <span className="text-cyan-400">Global</span> Economy.
            </p>
          </motion.div>

          {/* 6. Quote */}
          <motion.div
            style={{ scale: quoteScale, opacity: quoteOpacity }}
            className="absolute max-w-5xl px-8 text-center z-20 pointer-events-none"
          >
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none drop-shadow-2xl">
              FUTURE <br />
              OF{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-400">
                ROBOTICS
              </span>
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Main Content - Appears after scroll sequence */}
      {/* Z-index 30 to ensure it sits above the sticky container */}
      <motion.div
        style={{ opacity: mainContentOpacity, y: mainContentY }}
        className="relative z-30 bg-transparent min-h-screen -mt-[100vh] pt-32 pb-20"
      >
        <div className="container mx-auto px-4">
          {/* Hero Slideshow */}
          <div className="mb-32">
            <HeroSlideshow />
          </div>

          {/* Why Choose - Interactive List */}
          <div className="mb-32 max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16">Why Decentralized?</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Trustless Verification",
                  desc: "Math, not humans, verifies the results. Smart contracts ensure every match outcome is recorded immutably.",
                  icon: "🔒",
                },
                {
                  title: "Global Economy",
                  desc: "Trade parts and robots worldwide. A borderless marketplace for autonomous machines.",
                  icon: "🌍",
                },
                {
                  title: "Permanent Legacy",
                  desc: "Your wins are recorded forever. Build a verifiable reputation that lasts.",
                  icon: "🏆",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="collapse collapse-plus bg-base-200 hover:bg-base-300 transition-colors group"
                >
                  <input type="radio" name="why-accordion" defaultChecked={index === 0} />
                  <div className="collapse-title text-2xl font-medium flex items-center gap-4">
                    <span className="text-3xl">{item.icon}</span>
                    {item.title}
                  </div>
                  <div className="collapse-content">
                    <p className="text-lg opacity-80 pb-4">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest News - Clean List Style */}
          <div className="mb-32 max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16">Latest News</h2>
            <div className="space-y-8">
              {newsItems.map((item, index) => (
                <Link href={item.link} key={index} target="_blank" rel="noopener noreferrer" className="block">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row gap-8 items-start group cursor-pointer border-b border-base-200 pb-8 last:border-0"
                  >
                    {/* Image */}
                    <div className="w-full md:w-64 h-40 rounded-2xl overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="badge badge-primary badge-outline">{item.category}</span>
                        <span className="text-sm opacity-50">{item.date}</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-base-content/70 leading-relaxed mb-4">{item.desc}</p>
                      <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform">
                        Read Article <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom CTA - Dynamic Columns */}
          <div className="mb-20 grid md:grid-cols-12 gap-6 h-[600px]">
            {/* Large Create Card */}
            <Link
              href="/create"
              className="md:col-span-7 card bg-primary text-primary-content shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="card-body justify-end relative z-10">
                <h2 className="card-title text-5xl mb-4">Create & Mint</h2>
                <p className="text-xl max-w-md">
                  Register your robot on the blockchain. Prove ownership. Build your legacy.
                </p>
                <div className="card-actions justify-end mt-8">
                  <button className="btn btn-secondary btn-lg rounded-full px-8">Start Creating</button>
                </div>
              </div>
            </Link>

            <div className="md:col-span-5 flex flex-col gap-6">
              {/* Match Card */}
              <Link
                href="/match"
                className="flex-1 card bg-secondary text-secondary-content shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="card-body justify-center relative z-10">
                  <h2 className="card-title text-3xl">Compete</h2>
                  <p>Join matches and climb the leaderboard.</p>
                </div>
              </Link>

              {/* Marketplace Card */}
              <Link
                href="/marketplace"
                className="flex-1 card bg-accent text-accent-content shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="card-body justify-center relative z-10">
                  <h2 className="card-title text-3xl">Trade</h2>
                  <p>Buy and sell robot parts and NFTs.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
