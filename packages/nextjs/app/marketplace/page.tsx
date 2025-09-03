"use client";

import { useEffect, useState } from "react";
import MyListedItems from "./ListedItem";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface NFTItem {
  itemId: bigint;
  nft: string;
  tokenId: bigint;
  price: bigint;
  seller: string;
  sold: boolean;
  name: string;
  description: string;
  image: string;
}

function BrowseNFTs() {
  const [loading, setLoading] = useState(true);
  const [nftItems, setNftItems] = useState<NFTItem[]>([]);

  const { data: itemCount } = useScaffoldReadContract({
    contractName: "Marketplace",
    functionName: "itemCount",
  });

  const loadNFTItems = async () => {
    if (!itemCount) return;

    try {
      setLoading(true);
      const items: NFTItem[] = [];

      // Load all available NFTs
      for (let index = 1; index <= Number(itemCount); index++) {
        try {
          // Get item from marketplace
          const item = await fetch(`/api/marketplace/item/${index}`).then(res => res.json());

          if (!item.sold) {
            // Get NFT metadata from IPFS
            const response = await fetch(item.tokenURI);
            const metadata = await response.json();

            // Create NFT item object
            const nftItem: NFTItem = {
              itemId: BigInt(index),
              nft: item.nft,
              tokenId: item.tokenId,
              price: item.price,
              seller: item.seller,
              sold: item.sold,
              name: metadata.name || "Unknown NFT",
              description: metadata.description || "No description",
              image: metadata.image || "/placeholder-image.png",
            };

            items.push(nftItem);
          }
        } catch (error) {
          console.log(`Error loading item ${index}:`, error);
        }
      }

      setNftItems(items);
    } catch (error) {
      console.log("Error loading NFT items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemCount) {
      loadNFTItems();
    }
  }, [itemCount]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <h2 className="text-2xl font-bold mt-4">Loading available NFTs...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 container mx-auto">
      <h2 className="text-2xl font-bold mb-4">Available NFTs</h2>
      {nftItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
          {nftItems.map((item, idx) => (
            <div key={idx} className="overflow-hidden">
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <figure>
                  <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                </figure>
                <div className="card-body p-4">
                  <h3 className="card-title text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-600">{item.description}</p>
                  <div className="card-actions justify-between items-center mt-2">
                    <div className="text-xs font-semibold text-green-600">{formatEther(item.price)} ETH</div>
                    <button className="btn btn-primary btn-sm">Buy Now</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold mb-2">No NFTs Available</h3>
          <p className="text-gray-600">There are currently no NFTs listed for sale</p>
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<"browse" | "my-items">("browse");
  const { address: account } = useAccount();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">🎯 NFT Marketplace 🎯</h1>

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
      {activeTab === "browse" && <BrowseNFTs />}

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
