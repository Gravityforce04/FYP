"use client";

import { useState } from "react";
import MyListedItems from "./ListedItem";
import { useAccount } from "wagmi";

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<"browse" | "my-items">("browse");
  const { address: account } = useAccount();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">� NFT Marketplace �</h1>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed justify-center mb-8">
        <button className={`tab ${activeTab === "browse" ? "tab-active" : ""}`} onClick={() => setActiveTab("browse")}>
          Browse NFTs
        </button>
        <button
          className={`tab ${activeTab === "my-items" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("my-items")}
        >
          My Listed Items
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "browse" && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Browse Available NFTs</h2>
          <p className="text-gray-600">NFT browsing functionality coming soon...</p>
          {/* Add your NFT browsing component here */}
        </div>
      )}

      {activeTab === "my-items" && (
        <div>
          {account ? (
            <MyListedItems />
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Connect Wallet</h2>
              <p className="text-gray-600">Please connect your wallet to view your listed items</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
