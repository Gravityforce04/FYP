"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
// import {useScaffoldWriteContract } from '~~/hooks/scaffold-eth';
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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
      <h2 className="text-2xl font-bold mb-4">Sold</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
        {items.map((item, idx) => (
          <div key={idx} className="overflow-hidden">
            <div className="card bg-base-100 shadow-xl">
              <figure>
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
              </figure>
              <div className="card-body p-4">
                <h3 className="card-title text-sm">{item.name}</h3>
                <p className="text-xs text-gray-600">{item.description}</p>
                <div className="card-actions justify-end mt-2">
                  <div className="text-xs">
                    <p>For {formatEther(item.totalPrice)} ETH</p>
                    <p>Received {formatEther(item.price)} ETH</p>
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

  const { address: account } = useAccount();

  // Use Scaffold-ETH hooks for contract interactions
  const { data: itemCount } = useScaffoldReadContract({
    contractName: "NFTMarketplace",
    functionName: "itemCount",
  });

  //   const { data: marketplaceItems } = useScaffoldReadContract({
  //     contractName: "NFTMarketplace",
  //     functionName: "items",
  //     args: [BigInt(1)], // This will need to be adjusted based on your contract
  //   });

  //   const { data: nftTokenURI } = useScaffoldReadContract({
  //     contractName: "RoboticsCompetition",
  //     functionName: "tokenURI",
  //     args: [BigInt(1)], // This will need to be adjusted based on your contract
  //   });

  const loadListedItems = async () => {
    if (!account || !itemCount) return;

    try {
      setLoading(true);
      //   let listedItems: ListedItem[] = [];
      //   let soldItems: ListedItem[] = [];

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

            listedItems.push(listedItem);

            // Add to sold items if sold
            if (item.sold) {
              soldItems.push(listedItem);
            }
          }
        } catch (error) {
          console.log(`Error loading item ${index}:`, error);
        }
      }

      setListedItems(listedItems);
      setSoldItems(soldItems);
    } catch (error) {
      console.log("Error loading listed items:", error);
      notification.error("Failed to load listed items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && itemCount) {
      loadListedItems();
    }
  }, [account, itemCount]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <h2 className="text-2xl font-bold mt-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {listedItems.length > 0 ? (
        <div className="px-5 py-3 container mx-auto">
          <h2 className="text-2xl font-bold mb-4">Listed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
            {listedItems.map((item, idx) => (
              <div key={idx} className="overflow-hidden">
                <div className="card bg-base-100 shadow-xl">
                  <figure>
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  </figure>
                  <div className="card-body p-4">
                    <h3 className="card-title text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-600">{item.description}</p>
                    <div className="card-actions justify-end mt-2">
                      <div className="text-xs font-semibold">{formatEther(item.totalPrice)} ETH</div>
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
          </div>
        </div>
      )}
    </div>
  );
}
