"use client";

import { useCallback, useEffect, useState } from "react";
import MyListedItems from "./ListedItem";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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

interface OwnedNFT {
  transactionHash: string;
  name: string;
  price: string;
  description: string;
  image: string;
  matchId: string;
  tokenId: number;
  timestamp: number;
  metadataUri: string;
}

function BrowseNFTs() {
  const [loading, setLoading] = useState(true);
  const [nftItems, setNftItems] = useState<NFTItem[]>([]);

  const { data: itemCount } = useScaffoldReadContract({
    contractName: "Marketplace",
    functionName: "itemCount",
  });

  const loadNFTItems = useCallback(async () => {
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
  }, [itemCount]);

  useEffect(() => {
    if (itemCount) {
      loadNFTItems();
    }
  }, [itemCount, loadNFTItems]);

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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

function OwnedNFTs() {
  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);

  const loadOwnedNFTs = () => {
    try {
      setLoading(true);
      const realNFTs: OwnedNFT[] = [];

      // Get all stored NFT keys
      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter(key => key.startsWith("nft-"));

      console.log("Found NFT keys:", nftKeys);

      // Load real NFT data from localStorage
      nftKeys.forEach(key => {
        try {
          const nftData = JSON.parse(localStorage.getItem(key) || "{}");
          console.log(`Loading NFT data for key ${key}:`, nftData);

          if (nftData.name && nftData.description && nftData.transactionHash) {
            // Check if image is a valid data URL or needs fallback
            if (!nftData.image || (!nftData.image.startsWith("data:") && !nftData.image.startsWith("http"))) {
              console.log(`Invalid image for NFT ${key}:`, nftData.image);
              // Use a placeholder if image is invalid
              nftData.image = "/placeholder-image.svg";
            }
            realNFTs.push(nftData);
          }
        } catch (parseError) {
          console.log("Error parsing stored NFT data:", parseError);
        }
      });

      // Sort by timestamp (newest first)
      realNFTs.sort((a, b) => b.timestamp - a.timestamp);
      console.log("Loaded owned NFTs:", realNFTs);
      setOwnedNFTs(realNFTs);
    } catch (error) {
      console.log("Error loading owned NFTs:", error);
      notification.error("Failed to load owned NFTs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnedNFTs();
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTransactionHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="px-5 py-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Owned NFTs</h2>
        <button className="btn btn-outline btn-sm" onClick={loadOwnedNFTs} title="Refresh NFT data">
          🔄 Refresh
        </button>
      </div>
      {ownedNFTs.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
          <p className="text-gray-600">You have not minted any NFTs yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ownedNFTs.map((nft, index) => (
            <div key={index} className="card bg-base-100 shadow-xl">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedNFT(nft)}
                />
              </figure>
              <div className="card-body p-4">
                <h3 className="card-title text-sm">{nft.name}</h3>
                <p className="text-xs text-gray-600 line-clamp-2">{nft.description}</p>
                <div className="text-xs text-gray-500">
                  <div>Token ID: {nft.tokenId}</div>
                  <div>Match ID: {nft.matchId}</div>
                  <div>Created: {formatTimestamp(nft.timestamp)}</div>
                </div>
                <div className="card-actions justify-between items-center mt-2">
                  <div className="text-xs font-semibold text-blue-600">{nft.price} ETH</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setSelectedNFT(nft)}>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NFT Details Modal */}
      {selectedNFT && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">NFT Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full h-64 object-cover rounded-lg" />
              </div>
              <div className="space-y-2">
                <div>
                  <strong>Name:</strong> {selectedNFT.name}
                </div>
                <div>
                  <strong>Description:</strong> {selectedNFT.description}
                </div>
                <div>
                  <strong>Token ID:</strong> {selectedNFT.tokenId}
                </div>
                <div>
                  <strong>Match ID:</strong> {selectedNFT.matchId}
                </div>
                <div>
                  <strong>Price:</strong> {selectedNFT.price} ETH
                </div>
                <div>
                  <strong>Created:</strong> {formatTimestamp(selectedNFT.timestamp)}
                </div>
                <div className="text-xs">
                  <strong>Transaction:</strong>{" "}
                  <a
                    href={`/blockexplorer/transaction/${selectedNFT.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    {formatTransactionHash(selectedNFT.transactionHash)}
                  </a>
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedNFT(null)}>
                Close
              </button>
            </div>
          </div>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">🎯 NFT Marketplace 🎯</h1>
        <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()} title="Refresh page">
          🔄 Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed justify-center mb-8">
        <button className={`tab ${activeTab === "browse" ? "tab-active" : ""}`} onClick={() => setActiveTab("browse")}>
          Browse NFTs
        </button>
        <button
          className={`tab ${activeTab === "my-items" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("my-items")}
        >
          My Items
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "browse" && <BrowseNFTs />}

      {activeTab === "my-items" && (
        <div>
          {account ? (
            <div className="space-y-8">
              {/* Listed Items Section */}
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">📋 Listed Items</h2>
                  <MyListedItems />
                </div>
              </div>

              {/* Owned NFTs Section */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <OwnedNFTs />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Connect Wallet</h2>
              <p className="text-gray-600">Please connect your wallet to view your items</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
