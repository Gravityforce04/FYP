"use client";

import { useCallback, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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

interface ListedItem {
  totalPrice: bigint;
  price: bigint;
  itemId: bigint;
  name: string;
  description: string;
  image: string;
  sold: boolean;
}

function renderSoldItems(items: ListedItem[]) {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Sold Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
        {items.map((item, idx) => (
          <div key={idx} className="overflow-hidden">
            <div className="card bg-base-100 shadow-xl">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
              </figure>
              <div className="card-body p-4">
                <h3 className="card-title text-sm">{item.name}</h3>
                <p className="text-xs text-gray-600">{item.description}</p>
                <div className="card-actions justify-end mt-2">
                  <div className="text-xs">
                    <p className="font-semibold">Sold for {formatEther(item.totalPrice)} ETH</p>
                    <p className="text-green-600">Received {formatEther(item.price)} ETH</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function MyListedItems() {
  const [loading, setLoading] = useState(true);
  const [listedItems, setListedItems] = useState<ListedItem[]>([]);
  const [soldItems, setSoldItems] = useState<ListedItem[]>([]);
  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);
  const [listingPrice, setListingPrice] = useState<string>("");
  const [isListing, setIsListing] = useState(false);

  const { address: account } = useAccount();

  // Use Scaffold-ETH hooks for contract interactions
  const { data: itemCount } = useScaffoldReadContract({
    contractName: "Marketplace",
    functionName: "itemCount",
  });

  // Get deployed contract info
  const { data: nftContractInfo } = useDeployedContractInfo({ contractName: "NFT" });
  const { data: marketplaceContractInfo } = useDeployedContractInfo({ contractName: "Marketplace" });

  // Use Scaffold-ETH hooks for contract interactions
  const { writeContractAsync: writeNFTContract } = useScaffoldWriteContract({
    contractName: "NFT",
  });

  const { writeContractAsync: writeMarketplaceContract } = useScaffoldWriteContract({
    contractName: "Marketplace",
  });

  const loadListedItems = useCallback(async () => {
    if (!account || !itemCount) return;

    try {
      setLoading(true);
      const items: ListedItem[] = [];
      const sold: ListedItem[] = [];

      // Load all items and check if they belong to the current user
      for (let index = 1; index <= Number(itemCount); index++) {
        try {
          // Get item from marketplace
          const item = await fetch(`/api/marketplace/item/${index}`).then(res => res.json());

          if (item.seller.toLowerCase() === account.toLowerCase()) {
            // Get NFT metadata from IPFS
            const response = await fetch(item.tokenURI);
            const metadata = await response.json();

            // Create listed item object
            const listedItem: ListedItem = {
              totalPrice: item.totalPrice || item.price,
              price: item.price,
              itemId: BigInt(index),
              name: metadata.name || "Unknown NFT",
              description: metadata.description || "No description",
              image: metadata.image || "/placeholder-image.png",
              sold: item.sold || false,
            };

            items.push(listedItem);

            // Add to sold items if sold
            if (item.sold) {
              sold.push(listedItem);
            }
          }
        } catch (error) {
          console.log(`Error loading item ${index}:`, error);
        }
      }

      setListedItems(items);
      setSoldItems(sold);
    } catch (error) {
      console.log("Error loading listed items:", error);
      notification.error("Failed to load listed items");
    } finally {
      setLoading(false);
    }
  }, [account, itemCount]);

  const loadOwnedNFTs = () => {
    try {
      const realNFTs: OwnedNFT[] = [];

      // Get all stored NFT keys
      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter(key => key.startsWith("nft-"));

      console.log("ListedItem - Found NFT keys:", nftKeys);

      // Load real NFT data from localStorage
      nftKeys.forEach(key => {
        try {
          const nftData = JSON.parse(localStorage.getItem(key) || "{}");
          console.log(`ListedItem - Loading NFT data for key ${key}:`, nftData);

          if (nftData.name && nftData.description && nftData.transactionHash) {
            // Check if image is a valid data URL or needs fallback
            if (!nftData.image || (!nftData.image.startsWith("data:") && !nftData.image.startsWith("http"))) {
              console.log(`ListedItem - Invalid image for NFT ${key}:`, nftData.image);
              // Use a placeholder if image is invalid
              nftData.image = "/placeholder-image.svg";
            }
            realNFTs.push(nftData);
          }
        } catch (parseError) {
          console.log("ListedItem - Error parsing stored NFT data:", parseError);
        }
      });

      // Sort by timestamp (newest first)
      realNFTs.sort((a, b) => b.timestamp - a.timestamp);
      console.log("ListedItem - Loaded owned NFTs:", realNFTs);
      setOwnedNFTs(realNFTs);
    } catch (error) {
      console.log("ListedItem - Error loading owned NFTs:", error);
    }
  };

  const listNFTOnMarketplace = async (nft: OwnedNFT, price: string) => {
    if (!nftContractInfo?.address || !marketplaceContractInfo?.address) {
      notification.error("Contract addresses not found. Cannot list NFT.");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      notification.error("Please enter a valid price");
      return;
    }

    setIsListing(true);

    try {
      // First approve the marketplace
      console.log("Approving marketplace to transfer NFT...");
      console.log("NFT Contract:", nftContractInfo.address);
      console.log("Marketplace Contract:", marketplaceContractInfo.address);
      console.log("Token ID:", nft.tokenId);

      await writeNFTContract({
        functionName: "approve",
        args: [marketplaceContractInfo.address, BigInt(nft.tokenId)],
        gas: BigInt(200000), // Gas limit for approve
      });
      notification.success("NFT approved for marketplace transfer!");

      // Wait for approval
      await new Promise(resolve => setTimeout(resolve, 2000));

      // List on marketplace
      console.log("Listing NFT on marketplace...");
      await writeMarketplaceContract({
        functionName: "listNFT",
        args: [nftContractInfo.address, BigInt(nft.tokenId), parseEther(price)],
        gas: BigInt(300000), // Gas limit for listNFT
      });

      notification.success("NFT listed on marketplace successfully!");

      // Refresh the listed items
      loadListedItems();
    } catch (error) {
      console.log("Marketplace listing error:", error);
      notification.error("Failed to list NFT on marketplace. Check console for details.");
    } finally {
      setIsListing(false);
    }
  };

  useEffect(() => {
    if (account && itemCount) {
      loadListedItems();
    }
    loadOwnedNFTs();
  }, [account, itemCount, loadListedItems]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <h2 className="text-2xl font-bold mt-4">Loading your items...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {listedItems.length > 0 ? (
        <div className="px-5 py-3 container mx-auto">
          <h2 className="text-2xl font-bold mb-4">Your Listed Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
            {listedItems.map((item, idx) => (
              <div key={idx} className="overflow-hidden">
                <div className="card bg-base-100 shadow-xl">
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  </figure>
                  <div className="card-body p-4">
                    <h3 className="card-title text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-600">{item.description}</p>
                    <div className="card-actions justify-end mt-2">
                      <div className="text-xs font-semibold text-blue-600">
                        Listed for {formatEther(item.totalPrice)} ETH
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {soldItems.length > 0 && renderSoldItems(soldItems)}
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold">No listed assets</h2>
            <p className="text-gray-600 mt-2">You have not listed any NFTs yet</p>
            <p className="text-sm text-gray-500 mt-1">List your first NFT to get started!</p>

            {ownedNFTs.length > 0 && (
              <div className="mt-6">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (ownedNFTs.length > 0) {
                      setSelectedNFT(ownedNFTs[0]);
                      setListingPrice(ownedNFTs[0].price);
                    }
                  }}
                >
                  📋 List Your First NFT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NFT Listing Modal */}
      {selectedNFT && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">List NFT on Marketplace</h3>
            <div className="space-y-4">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full h-32 object-cover rounded-lg" />
              </div>
              <div>
                <div>
                  <strong>Name:</strong> {selectedNFT.name}
                </div>
                <div>
                  <strong>Token ID:</strong> {selectedNFT.tokenId}
                </div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Listing Price (ETH)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.01"
                  className="input input-bordered w-full"
                  value={listingPrice}
                  onChange={e => setListingPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={() => {
                  listNFTOnMarketplace(selectedNFT, listingPrice);
                  setSelectedNFT(null);
                }}
                disabled={isListing || !listingPrice || parseFloat(listingPrice) <= 0}
              >
                {isListing ? "Listing..." : "📋 List NFT"}
              </button>
              <button className="btn" onClick={() => setSelectedNFT(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
