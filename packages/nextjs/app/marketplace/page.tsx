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
    console.log("Loading NFT items, itemCount:", itemCount);

    if (!itemCount) {
      console.log("No item count available, setting loading to false");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items: NFTItem[] = [];
      console.log("Starting to load items from marketplace...");

      // Load all available NFTs
      for (let index = 1; index <= Number(itemCount); index++) {
        try {
          console.log(`Loading item ${index}...`);
          // Get item from marketplace
          const response = await fetch(`/api/marketplace/item/${index}`);
          console.log(`API response for item ${index}:`, response.status);

          if (!response.ok) {
            console.log(`Item ${index} not found or error:`, response.status);
            continue;
          }

          const item = await response.json();
          console.log(`Item ${index} data:`, item);

          if (!item.sold) {
            // Get NFT metadata from IPFS
            try {
              const metadataResponse = await fetch(item.tokenURI);
              const metadata = await metadataResponse.json();
              console.log(`Metadata for item ${index}:`, metadata);

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
              console.log(`Added item ${index} to list`);
            } catch (metadataError) {
              console.log(`Error loading metadata for item ${index}:`, metadataError);
            }
          } else {
            console.log(`Item ${index} is already sold`);
          }
        } catch (error) {
          console.log(`Error loading item ${index}:`, error);
        }
      }

      console.log("Final items loaded:", items);
      setNftItems(items);

      // If no items found from marketplace, try loading from localStorage as fallback
      if (items.length === 0) {
        console.log("No items found in marketplace, trying localStorage fallback...");
        loadFromLocalStorage();
      }
    } catch (error) {
      console.log("Error loading NFT items:", error);
      // Try localStorage fallback on error
      loadFromLocalStorage();
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  }, [itemCount]);

  // Fallback function to load NFTs from localStorage
  const loadFromLocalStorage = useCallback(() => {
    console.log("Loading NFTs from localStorage as fallback...");
    try {
      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter(key => key.startsWith("nft-") && !key.includes("metadata"));
      const fallbackItems: NFTItem[] = [];

      nftKeys.forEach(key => {
        try {
          const nftData = JSON.parse(localStorage.getItem(key) || "{}");
          if (nftData.name && nftData.description && nftData.transactionHash) {
            // Create a marketplace item from localStorage data
            const fallbackItem: NFTItem = {
              itemId: BigInt(nftData.tokenId || 1),
              nft: "0x0000000000000000000000000000000000000000", // Placeholder
              tokenId: nftData.tokenId || 1,
              price: nftData.price || "0.01",
              seller: nftData.creator || "0x0000000000000000000000000000000000000000",
              sold: false,
              name: nftData.name,
              description: nftData.description,
              image: nftData.image || "/placeholder-image.png",
            };
            fallbackItems.push(fallbackItem);
          }
        } catch (error) {
          console.log("Error parsing localStorage NFT data:", error);
        }
      });

      console.log("Fallback items loaded:", fallbackItems);
      if (fallbackItems.length > 0) {
        setNftItems(fallbackItems);
      }
    } catch (error) {
      console.log("Error loading from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    if (itemCount) {
      loadNFTItems();
    } else {
      // If no itemCount, try localStorage fallback
      loadFromLocalStorage();
    }
  }, [itemCount, loadNFTItems, loadFromLocalStorage]);

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
  const { address: connectedAddress } = useAccount();

  const loadOwnedNFTs = () => {
    try {
      setLoading(true);
      const realNFTs: OwnedNFT[] = [];

      if (!connectedAddress) {
        console.log("No wallet connected, clearing owned NFTs");
        setOwnedNFTs([]);
        setLoading(false);
        return;
      }

      // Get all stored NFT keys
      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter(key => key.startsWith("nft-") && !key.includes("metadata"));

      console.log("Found NFT keys:", nftKeys);
      console.log("Loading NFTs for connected wallet:", connectedAddress);

      // Load real NFT data from localStorage and filter by connected wallet
      nftKeys.forEach(key => {
        try {
          const nftData = JSON.parse(localStorage.getItem(key) || "{}");
          console.log(`Loading NFT data for key ${key}:`, nftData);

          if (nftData.name && nftData.description && nftData.transactionHash) {
            // Only show NFTs created by the connected wallet
            if (nftData.creator && nftData.creator.toLowerCase() === connectedAddress.toLowerCase()) {
              // Skip placeholder/recovered NFTs with generic names
              if (nftData.name.includes("Recovered NFT") || nftData.name.includes("NFT #")) {
                console.log("Skipping placeholder NFT:", nftData.name);
                return;
              }

              // Check if image is a valid data URL or needs fallback
              if (!nftData.image || (!nftData.image.startsWith("data:") && !nftData.image.startsWith("http"))) {
                console.log(`Invalid image for NFT ${key}:`, nftData.image);
                // Use a placeholder if image is invalid
                nftData.image = "/placeholder-image.svg";
              }
              realNFTs.push(nftData);
            }
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
  }, [connectedAddress]);

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
