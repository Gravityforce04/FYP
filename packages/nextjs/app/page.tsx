"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { CubeIcon, ShoppingCartIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Robotics eSports Platform</span>
            <span className="block text-xl mt-2 text-secondary">Powered by Blockchain & NFTs</span>
          </h1>

          {connectedAddress && (
            <div className="flex justify-center items-center space-x-2 flex-col mt-4">
              <p className="my-2 font-medium">Connected Address:</p>
              <Address address={connectedAddress} />
            </div>
          )}

          <p className="text-center text-lg mt-6">
            Experience transparent, tamper-proof robotics competitions with verifiable results and NFT rewards
          </p>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <TrophyIcon className="h-8 w-8 fill-secondary" />
              <p className="mt-4">
                View and verify competition results on the{" "}
                <Link href="/competition" passHref className="link">
                  Competitions
                </Link>{" "}
                page.
              </p>
            </div>

            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <CubeIcon className="h-8 w-8 fill-secondary" />
              <p className="mt-4">
                Create and mint your competition NFTs in the{" "}
                <Link href="/create" passHref className="link">
                  Create NFT
                </Link>{" "}
                page.
              </p>
            </div>

            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <ShoppingCartIcon className="h-8 w-8 fill-secondary" />
              <p className="mt-4">
                Trade robotics competition NFTs on the{" "}
                <Link href="/marketplace" passHref className="link">
                  Marketplace
                </Link>{" "}
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
