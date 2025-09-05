"use client";

import { useCallback, useEffect, useState } from "react";
import MyListedItems from "./ListedItem";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
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
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { data: itemCount } = useScaffoldReadContract({
    contractName: "Marketplace",
    functionName: "itemCount",
  });

  const { writeContractAsync: writeMarketplaceContract } = useScaffoldWriteContract({
    contractName: "Marketplace",
  });

  const { address: connectedAddress } = useAccount();

  // Purchase NFT function
  const purchaseNFT = async (item: NFTItem) => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet to purchase NFTs");
      return;
    }

    if (item.seller.toLowerCase() === connectedAddress.toLowerCase()) {
      notification.error("You cannot buy your own NFT");
      return;
    }

    setIsPurchasing(true);
    try {
      // Calculate total price including fees (assuming 5% fee based on the contract)
      // The contract uses: ((price * (100 + feePercent)) / 100)
      // For 5% fee: ((price * 105) / 100)
      const feePercent = 5; // 5% fee
      const totalPrice = (item.price * BigInt(100 + feePercent)) / BigInt(100);

      console.log("🛒 Purchasing NFT...");
      console.log("Item ID:", item.itemId);
      console.log("Base Price (ETH):", formatEther(item.price));
      console.log("Total Price with fees (ETH):", formatEther(totalPrice));
      console.log("Fee:", formatEther(totalPrice - item.price));
      console.log("Buyer:", connectedAddress);

      await writeMarketplaceContract({
        functionName: "purchaseNFT",
        args: [item.itemId],
        value: totalPrice, // Send total price including fees
        gas: BigInt(500000),
      });

      notification.success("NFT purchased successfully!");
      setSelectedNFT(null);

      // Refresh the marketplace
      loadNFTItems();
    } catch (error) {
      console.log("❌ Purchase error:", error);
      notification.error("Failed to purchase NFT. Check console for details.");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Fallback function to load NFTs from localStorage (only if they're in marketplace contract)
  const loadFromLocalStorage = useCallback(async () => {
    console.log("Loading NFTs from localStorage as fallback...");
    try {
      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter(key => key.startsWith("nft-") && !key.includes("metadata"));
      const fallbackItems: NFTItem[] = [];

      // Get contract addresses for verification
      const { createPublicClient, http } = await import("viem");
      const { localhost } = await import("viem/chains");

      const publicClient = createPublicClient({
        chain: localhost,
        transport: http("http://127.0.0.1:8545"),
      });

      const contracts = await import("~~/contracts/deployedContracts");
      const nftAddress = contracts.default[31337].NFT.address;
      const marketplaceAddress = contracts.default[31337].Marketplace.address;

      for (const key of nftKeys) {
        try {
          const nftData = JSON.parse(localStorage.getItem(key) || "{}");
          if (nftData.name && nftData.description && nftData.transactionHash) {
            // Verify that the NFT is actually in the marketplace contract
            try {
              const actualOwner = await publicClient.readContract({
                address: nftAddress as `0x${string}`,
                abi: contracts.default[31337].NFT.abi,
                functionName: "ownerOf",
                args: [BigInt(nftData.tokenId || 1)],
              });

              if (actualOwner.toLowerCase() === marketplaceAddress.toLowerCase()) {
                // Create a marketplace item from localStorage data
                const fallbackItem: NFTItem = {
                  itemId: BigInt(nftData.tokenId || 1),
                  nft: "0x0000000000000000000000000000000000000000", // Placeholder
                  tokenId: BigInt(nftData.tokenId || 1),
                  price: parseEther(nftData.price || "0.01"), // Convert string to BigInt
                  seller: nftData.creator || "0x0000000000000000000000000000000000000000",
                  sold: false,
                  name: nftData.name,
                  description: nftData.description,
                  image: nftData.image || "/placeholder-image.png",
                };
                fallbackItems.push(fallbackItem);
                console.log(`✅ Fallback: Added ${nftData.name} (verified in marketplace contract)`);
              } else {
                console.log(`❌ Fallback: Skipped ${nftData.name} (not in marketplace contract)`);
              }
            } catch (ownershipError) {
              console.log(`Error verifying ownership for fallback item ${nftData.name}:`, ownershipError);
            }
          }
        } catch (error) {
          console.log("Error parsing localStorage NFT data:", error);
        }
      }

      console.log("Fallback items loaded:", fallbackItems);
      if (fallbackItems.length > 0) {
        setNftItems(fallbackItems);
      }
    } catch (error) {
      console.log("Error loading from localStorage:", error);
    }
  }, []);

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
            // Verify that the NFT is actually in the marketplace contract
            try {
              const { createPublicClient, http } = await import("viem");
              const { localhost } = await import("viem/chains");

              const publicClient = createPublicClient({
                chain: localhost,
                transport: http("http://127.0.0.1:8545"),
              });

              // Get contract addresses
              const contracts = await import("~~/contracts/deployedContracts");
              const nftAddress = contracts.default[31337].NFT.address;
              const marketplaceAddress = contracts.default[31337].Marketplace.address;

              // Check who actually owns the NFT
              const actualOwner = await publicClient.readContract({
                address: nftAddress as `0x${string}`,
                abi: contracts.default[31337].NFT.abi,
                functionName: "ownerOf",
                args: [BigInt(item.tokenId)],
              });

              console.log(`Item ${index} - Listed owner: ${item.seller}, Actual owner: ${actualOwner}`);

              // Only show if the NFT is actually in the marketplace contract
              if (actualOwner.toLowerCase() === marketplaceAddress.toLowerCase()) {
                // Get NFT metadata from IPFS
                try {
                  const metadataResponse = await fetch(item.tokenURI);
                  const metadata = await metadataResponse.json();
                  console.log(`Metadata for item ${index}:`, metadata);

                  // Create NFT item object
                  const nftItem: NFTItem = {
                    itemId: BigInt(index),
                    nft: item.nft,
                    tokenId: BigInt(item.tokenId),
                    price: BigInt(item.price), // Convert string back to BigInt
                    seller: item.seller,
                    sold: item.sold,
                    name: metadata.name || "Unknown NFT",
                    description: metadata.description || "No description",
                    image: metadata.image || "/placeholder-image.png",
                  };

                  items.push(nftItem);
                  console.log(`✅ Added item ${index} to list (verified in marketplace contract)`);
                } catch (metadataError) {
                  console.log(`Error loading metadata for item ${index}:`, metadataError);
                }
              } else {
                console.log(`❌ Item ${index} not in marketplace contract (owner: ${actualOwner}), skipping`);
                console.log(
                  `🔧 This indicates the listNFT transaction failed - NFT was not transferred to marketplace`,
                );
              }
            } catch (ownershipError) {
              console.log(`Error verifying ownership for item ${index}:`, ownershipError);
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
  }, [itemCount, loadFromLocalStorage]);

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Available NFTs</h2>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline" onClick={() => loadNFTItems()}>
            🔄 Refresh
          </button>
        </div>
      </div>
      {nftItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-3">
          {nftItems.map((item, idx) => (
            <div key={idx} className="overflow-hidden">
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => setSelectedNFT(item)}
                  />
                </figure>
                <div className="card-body p-4">
                  <h3 className="card-title text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-600">{item.description}</p>
                  <div className="card-actions justify-between items-center mt-2">
                    <div className="text-xs font-semibold text-green-600">
                      {formatEther((item.price * BigInt(105)) / BigInt(100))} ETH
                      <div className="text-xs text-gray-500">(incl. 5% fee)</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => setSelectedNFT(item)}>
                        View Details
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => purchaseNFT(item)}
                        disabled={
                          isPurchasing ||
                          (connectedAddress ? item.seller.toLowerCase() === connectedAddress.toLowerCase() : false)
                        }
                      >
                        {isPurchasing ? "Buying..." : "Buy Now"}
                      </button>
                    </div>
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
                  <strong>Token ID:</strong> {selectedNFT.tokenId.toString()}
                </div>
                <div>
                  <strong>Item ID:</strong> {selectedNFT.itemId.toString()}
                </div>
                <div>
                  <strong>Base Price:</strong> {formatEther(selectedNFT.price)} ETH
                </div>
                <div>
                  <strong>Total Price (with 5% fee):</strong>{" "}
                  {formatEther((selectedNFT.price * BigInt(105)) / BigInt(100))} ETH
                </div>
                <div>
                  <strong>Seller:</strong> {selectedNFT.seller}
                </div>
                <div>
                  <strong>NFT Contract:</strong> {selectedNFT.nft}
                </div>
                <div>
                  <strong>Status:</strong> {selectedNFT.sold ? "Sold" : "Available"}
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={() => purchaseNFT(selectedNFT)}
                disabled={
                  isPurchasing ||
                  (connectedAddress ? selectedNFT.seller.toLowerCase() === connectedAddress.toLowerCase() : false)
                }
              >
                {isPurchasing
                  ? "Buying..."
                  : `Buy for ${formatEther((selectedNFT.price * BigInt(105)) / BigInt(100))} ETH`}
              </button>
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

function OwnedNFTs() {
  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);
  const { address: connectedAddress } = useAccount();

  const loadOwnedNFTs = useCallback(async () => {
    try {
      setLoading(true);
      const realNFTs: OwnedNFT[] = [];

      if (!connectedAddress) {
        console.log("No wallet connected, clearing owned NFTs");
        setOwnedNFTs([]);
        setLoading(false);
        return;
      }

      console.log("Loading NFTs for connected wallet:", connectedAddress);

      // Get contract addresses
      const { createPublicClient, http } = await import("viem");
      const { localhost } = await import("viem/chains");

      const publicClient = createPublicClient({
        chain: localhost,
        transport: http("http://127.0.0.1:8545"),
      });

      const contracts = await import("~~/contracts/deployedContracts");
      const nftAddress = contracts.default[31337].NFT.address;

      // Get total supply to know how many NFTs exist
      const totalSupply = await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: contracts.default[31337].NFT.abi,
        functionName: "tokenCount",
      });

      console.log(`Total NFT supply: ${totalSupply}`);
      console.log(`🔍 TOKEN ID COLLISION DEBUG - Checking for duplicate token IDs`);

      // Check ownership of each token ID
      for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
        try {
          const owner = await publicClient.readContract({
            address: nftAddress as `0x${string}`,
            abi: contracts.default[31337].NFT.abi,
            functionName: "ownerOf",
            args: [BigInt(tokenId)],
          });

          console.log(`Token ${tokenId} owner: ${owner}`);

          // Check for token ID collisions
          if (tokenId === 1 && owner.toLowerCase() !== connectedAddress.toLowerCase()) {
            console.log(
              `⚠️  TOKEN ID COLLISION DETECTED: Token 1 is owned by ${owner}, not connected wallet ${connectedAddress}`,
            );
          }

          // If the connected wallet owns this NFT
          if (owner.toLowerCase() === connectedAddress.toLowerCase()) {
            console.log(`✅ Found owned NFT: Token ${tokenId}`);

            // Try to get metadata from localStorage first
            let nftData = null;
            const keys = Object.keys(localStorage);
            const nftKeys = keys.filter(key => key.startsWith("nft-") && !key.includes("metadata"));

            console.log(`🔍 Checking localStorage for token ${tokenId}, found keys:`, nftKeys);

            for (const key of nftKeys) {
              try {
                const storedData = JSON.parse(localStorage.getItem(key) || "{}");
                console.log(`  Checking key ${key}:`, storedData);
                if (storedData.tokenId === tokenId) {
                  nftData = storedData;
                  console.log(`  ✅ Found localStorage data for token ${tokenId}:`, nftData);
                  break;
                }
              } catch (error) {
                console.log("Error parsing localStorage data:", error);
              }
            }

            if (!nftData) {
              console.log(`❌ No localStorage data found for token ${tokenId}`);

              // Try to find image data in localStorage even if main NFT data is missing
              const imageKeys = keys.filter(key => key.includes("image") || key.includes("metadata"));
              for (const key of imageKeys) {
                try {
                  const imageData = JSON.parse(localStorage.getItem(key) || "{}");
                  if (imageData.tokenId === tokenId && imageData.image) {
                    console.log(
                      `Found image data in localStorage key ${key}:`,
                      imageData.image.substring(0, 50) + "...",
                    );
                    // We'll use this image data later if the blockchain metadata has a placeholder
                  }
                } catch (error) {
                  console.log(`Error parsing image data from ${key}:`, error);
                }
              }
            }

            // If no localStorage data, try to get from blockchain
            if (!nftData) {
              try {
                const tokenURI = await publicClient.readContract({
                  address: nftAddress as `0x${string}`,
                  abi: contracts.default[31337].NFT.abi,
                  functionName: "tokenURI",
                  args: [BigInt(tokenId)],
                });

                console.log(`Token ${tokenId} URI: ${tokenURI}`);

                let metadata = null;

                if (tokenURI && tokenURI.startsWith("ipfs://")) {
                  const metadataUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
                  const metadataResponse = await fetch(metadataUrl);
                  metadata = await metadataResponse.json();
                } else if (tokenURI && tokenURI.startsWith("data:application/json;base64,")) {
                  // Handle base64 encoded metadata
                  const base64Data = tokenURI.split(",")[1];
                  const jsonString = atob(base64Data);
                  metadata = JSON.parse(jsonString);
                  console.log(`Decoded base64 metadata for token ${tokenId}:`, metadata);
                  console.log(`Image field in metadata:`, metadata.image);
                  console.log(`Image type:`, typeof metadata.image);
                  console.log(`Image starts with data:`, metadata.image?.startsWith("data:"));
                }

                if (metadata) {
                  // Try to find the listing transaction hash (transfer from minter to marketplace)
                  let actualTransactionHash = "blockchain-recovered";

                  try {
                    // Get contract addresses
                    const contracts = await import("~~/contracts/deployedContracts");
                    const marketplaceAddress = contracts.default[31337].Marketplace.address;

                    // Get Transfer events for this token
                    const transferEvents = await publicClient.getLogs({
                      address: nftAddress as `0x${string}`,
                      event: {
                        type: "event",
                        name: "Transfer",
                        inputs: [
                          { name: "from", type: "address", indexed: true },
                          { name: "to", type: "address", indexed: true },
                          { name: "tokenId", type: "uint256", indexed: true },
                        ],
                      },
                      args: {
                        tokenId: BigInt(tokenId),
                      },
                      fromBlock: 0n,
                      toBlock: "latest",
                    });

                    console.log(`Found ${transferEvents.length} transfer events for token ${tokenId}`);
                    console.log(`Marketplace address: ${marketplaceAddress}`);

                    if (transferEvents.length > 0) {
                      // Debug: Show all transfer events
                      transferEvents.forEach((event, index) => {
                        try {
                          if (event.args) {
                            const fromAddress = event.args.from;
                            const toAddress = event.args.to;
                            console.log(
                              `  Transfer ${index + 1}: From ${fromAddress} To ${toAddress} Tx: ${event.transactionHash}`,
                            );
                          } else {
                            console.log(`  Transfer ${index + 1}: Invalid event structure:`, event);
                          }
                        } catch (error) {
                          console.log(`  Transfer ${index + 1}: Error parsing event:`, error, event);
                        }
                      });

                      // Look for the transfer TO the marketplace contract (listing transaction)
                      const listingTransfer = transferEvents.find(event => {
                        try {
                          if (event.args && event.args.to) {
                            // Check if the 'to' address is the marketplace contract
                            const toAddress = event.args.to;
                            const isListing = toAddress.toLowerCase() === marketplaceAddress.toLowerCase();
                            console.log(`  Checking transfer to ${toAddress} - is listing: ${isListing}`);
                            return isListing;
                          } else {
                            console.log(`  Skipping invalid event structure`);
                            return false;
                          }
                        } catch (error) {
                          console.log(`  Error checking transfer:`, error);
                          return false;
                        }
                      });

                      if (listingTransfer) {
                        actualTransactionHash = listingTransfer.transactionHash;
                        console.log(`✅ Found listing transaction for token ${tokenId}: ${actualTransactionHash}`);
                        if (listingTransfer.args) {
                          console.log(`  Listed by: ${listingTransfer.args.from}`);
                        }
                        console.log(`  Listed to marketplace: ${marketplaceAddress}`);
                      } else {
                        // If no listing transfer found, get the most recent transfer
                        const latestTransfer = transferEvents[transferEvents.length - 1];
                        actualTransactionHash = latestTransfer.transactionHash;
                        console.log(
                          `⚠️  No listing transfer found, using latest transfer for token ${tokenId}: ${actualTransactionHash}`,
                        );
                        if (latestTransfer.args) {
                          console.log(
                            `  Latest transfer: From ${latestTransfer.args.from} To ${latestTransfer.args.to}`,
                          );
                        }
                      }
                    } else {
                      console.log(`❌ No transfer events found for token ${tokenId}`);
                    }
                  } catch (searchError) {
                    console.log(`Error searching for transfer events:`, searchError);
                  }

                  // Alternative approach: Look for Listed events in marketplace contract
                  if (actualTransactionHash === "blockchain-recovered") {
                    try {
                      console.log(`Trying alternative approach: Looking for Listed events in marketplace contract`);

                      // Get marketplace address
                      const contracts = await import("~~/contracts/deployedContracts");
                      const marketplaceAddress = contracts.default[31337].Marketplace.address;

                      const listedEvents = await publicClient.getLogs({
                        address: marketplaceAddress as `0x${string}`,
                        event: {
                          type: "event",
                          name: "Listed",
                          inputs: [
                            { name: "itemId", type: "uint256", indexed: true },
                            { name: "nft", type: "address", indexed: true },
                            { name: "tokenId", type: "uint256", indexed: true },
                            { name: "price", type: "uint256", indexed: false },
                            { name: "seller", type: "address", indexed: false },
                          ],
                        },
                        args: {
                          tokenId: BigInt(tokenId),
                        },
                        fromBlock: 0n,
                        toBlock: "latest",
                      });

                      console.log(`Found ${listedEvents.length} Listed events for token ${tokenId}`);

                      if (listedEvents.length > 0) {
                        // Get the most recent Listed event
                        const latestListedEvent = listedEvents[listedEvents.length - 1];
                        actualTransactionHash = latestListedEvent.transactionHash;
                        console.log(`✅ Found listing event for token ${tokenId}: ${actualTransactionHash}`);
                      } else {
                        console.log(`❌ No Listed events found for token ${tokenId}`);
                      }
                    } catch (listedEventError) {
                      console.log(`Error searching for Listed events:`, listedEventError);
                    }
                  }

                  // Process the image URL
                  let imageUrl = metadata.image || "/placeholder-image.svg";

                  // Check if the image is just a placeholder
                  if (imageUrl.includes("NFT Image") || imageUrl.includes("placeholder")) {
                    console.log(`Detected placeholder image for token ${tokenId}, trying external_url`);

                    // Try to get the real image from external_url
                    if (metadata.external_url) {
                      try {
                        console.log(`Fetching metadata from external_url: ${metadata.external_url}`);
                        const externalResponse = await fetch(metadata.external_url);
                        const externalMetadata = await externalResponse.json();

                        if (externalMetadata.image && !externalMetadata.image.includes("NFT Image")) {
                          imageUrl = externalMetadata.image;
                          console.log(`Found real image from external_url: ${imageUrl.substring(0, 50)}...`);
                        } else {
                          console.log(`External metadata also has placeholder image`);
                        }
                      } catch (error) {
                        console.log(`Error fetching external metadata:`, error);
                      }
                    }
                  }

                  // Handle base64 encoded images
                  if (imageUrl.startsWith("data:image/")) {
                    // Image is already base64 encoded, use as is
                    console.log(`Using base64 image for token ${tokenId}`);
                  } else if (imageUrl.startsWith("ipfs://")) {
                    // Convert IPFS URL to HTTP
                    imageUrl = imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
                    console.log(`Converted IPFS image for token ${tokenId}: ${imageUrl}`);
                  } else if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
                    // If it's not a valid URL, use placeholder
                    imageUrl = "/placeholder-image.svg";
                    console.log(`Invalid image URL for token ${tokenId}, using placeholder`);
                  }

                  nftData = {
                    name: metadata.name || `NFT #${tokenId}`,
                    description: metadata.description || "No description",
                    image: imageUrl,
                    tokenId: tokenId,
                    creator: owner, // Current owner
                    timestamp: Date.now(),
                    transactionHash: actualTransactionHash,
                    matchId: metadata.attributes?.matchId || "unknown",
                    price: "0.01",
                  };
                  console.log(`Created nftData from blockchain for token ${tokenId}:`, nftData);
                } else {
                  console.log(`No metadata found for token ${tokenId}`);
                }
              } catch (metadataError) {
                console.log(`Error getting metadata for token ${tokenId}:`, metadataError);
              }
            }

            // If we have NFT data, add it to the list
            if (nftData) {
              console.log(`Processing nftData for token ${tokenId}:`, nftData);

              // Skip placeholder/recovered NFTs with generic names
              if (nftData.name.includes("Recovered NFT") || nftData.name.includes("NFT #")) {
                console.log(`❌ Skipping placeholder NFT: ${nftData.name}`);
                continue;
              }

              // TEMPORARY: Allow all NFTs for debugging
              console.log(`🔍 NFT name check: "${nftData.name}" - allowing for debugging`);

              // Check if image is valid
              if (
                !nftData.image ||
                (!nftData.image.startsWith("data:") &&
                  !nftData.image.startsWith("http") &&
                  !nftData.image.startsWith("/"))
              ) {
                console.log(`⚠️  Invalid image for NFT ${tokenId}:`, nftData.image);
                nftData.image = "/placeholder-image.svg";
              } else {
                console.log(`✅ Valid image for NFT ${tokenId}:`, nftData.image.substring(0, 50) + "...");
              }

              realNFTs.push(nftData);
              console.log(`✅ Added owned NFT: ${nftData.name} (Token ${tokenId})`);
            } else {
              console.log(`❌ No nftData found for token ${tokenId}`);
            }
          }
        } catch (error) {
          console.log(`Error checking ownership for token ${tokenId}:`, error);
        }
      }

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
  }, [connectedAddress]);

  useEffect(() => {
    loadOwnedNFTs();
  }, [loadOwnedNFTs]);

  // Debug function to identify token ID mismatches
  const debugTokenMismatches = useCallback(async () => {
    if (!connectedAddress) {
      console.log("❌ No wallet connected");
      return;
    }

    console.log("🔍 DEBUGGING TOKEN ID MISMATCHES");
    console.log("=".repeat(50));

    try {
      const { createPublicClient, http } = await import("viem");
      const { localhost } = await import("viem/chains");

      const publicClient = createPublicClient({
        chain: localhost,
        transport: http("http://127.0.0.1:8545"),
      });

      const contracts = await import("~~/contracts/deployedContracts");
      const nftAddress = contracts.default[31337].NFT.address;

      // Get total supply
      const totalSupply = await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: contracts.default[31337].NFT.abi,
        functionName: "tokenCount",
      });

      console.log(`📊 Total NFT Supply: ${totalSupply}`);
      console.log(`👤 Connected Wallet: ${connectedAddress}`);

      // Check each token ID
      for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
        try {
          const owner = await publicClient.readContract({
            address: nftAddress as `0x${string}`,
            abi: contracts.default[31337].NFT.abi,
            functionName: "ownerOf",
            args: [BigInt(tokenId)],
          });

          const isOwned = owner.toLowerCase() === connectedAddress.toLowerCase();
          console.log(`Token ${tokenId}: Owner=${owner}, Owned=${isOwned ? "✅" : "❌"}`);

          // Check localStorage data for this token
          const keys = Object.keys(localStorage);
          const nftKeys = keys.filter(key => key.startsWith("nft-") && !key.includes("metadata"));

          for (const key of nftKeys) {
            try {
              const storedData = JSON.parse(localStorage.getItem(key) || "{}");
              if (storedData.tokenId === tokenId) {
                console.log(`  📁 localStorage[${key}]: Name="${storedData.name}", Creator="${storedData.creator}"`);
                console.log(`  🔄 Mismatch Check: Stored creator=${storedData.creator}, Actual owner=${owner}`);
                if (storedData.creator && storedData.creator.toLowerCase() !== owner.toLowerCase()) {
                  console.log(`  ⚠️  MISMATCH DETECTED: Token ${tokenId} creator doesn't match current owner!`);
                }
              }
            } catch (error) {
              console.log(`  ❌ Error parsing localStorage key ${key}:`, error);
            }
          }
        } catch (error) {
          console.log(`❌ Error checking token ${tokenId}:`, error);
        }
      }

      console.log("=".repeat(50));
      console.log("🔍 DEBUG COMPLETE");
    } catch (error) {
      console.log("❌ Debug error:", error);
    }
  }, [connectedAddress]);

  // Clean function to remove incorrect data
  const cleanIncorrectData = useCallback(async () => {
    if (!connectedAddress) {
      console.log("❌ No wallet connected");
      return;
    }

    console.log("🧹 CLEANING INCORRECT DATA");
    console.log("=".repeat(50));

    try {
      const { createPublicClient, http } = await import("viem");
      const { localhost } = await import("viem/chains");

      const publicClient = createPublicClient({
        chain: localhost,
        transport: http("http://127.0.0.1:8545"),
      });

      const contracts = await import("~~/contracts/deployedContracts");
      const nftAddress = contracts.default[31337].NFT.address;

      // Get total supply
      const totalSupply = await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: contracts.default[31337].NFT.abi,
        functionName: "tokenCount",
      });

      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter(key => key.startsWith("nft-") && !key.includes("metadata"));
      let cleanedCount = 0;

      for (const key of nftKeys) {
        try {
          const storedData = JSON.parse(localStorage.getItem(key) || "{}");
          if (storedData.tokenId && storedData.tokenId <= Number(totalSupply)) {
            // Check actual ownership
            const owner = await publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: contracts.default[31337].NFT.abi,
              functionName: "ownerOf",
              args: [BigInt(storedData.tokenId)],
            });

            // If the stored creator doesn't match the actual owner, remove it
            if (storedData.creator && storedData.creator.toLowerCase() !== owner.toLowerCase()) {
              console.log(`🗑️  Removing incorrect data: ${key} (Token ${storedData.tokenId})`);
              console.log(`   Stored creator: ${storedData.creator}`);
              console.log(`   Actual owner: ${owner}`);
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          console.log(`❌ Error processing key ${key}:`, error);
        }
      }

      console.log(`✅ Cleaned ${cleanedCount} incorrect entries`);
      console.log("=".repeat(50));
      console.log("🧹 CLEAN COMPLETE");

      // Refresh the owned NFTs after cleaning
      loadOwnedNFTs();
    } catch (error) {
      console.log("❌ Clean error:", error);
    }
  }, [connectedAddress, loadOwnedNFTs]);

  // Debug function to investigate token ID collision
  const debugTokenCollision = useCallback(async () => {
    console.log("🔍 DEBUGGING TOKEN ID COLLISION");
    console.log("=".repeat(50));

    try {
      const { createPublicClient, http } = await import("viem");
      const { localhost } = await import("viem/chains");

      const publicClient = createPublicClient({
        chain: localhost,
        transport: http("http://127.0.0.1:8545"),
      });

      const contracts = await import("~~/contracts/deployedContracts");
      const nftAddress = contracts.default[31337].NFT.address;

      // Get total supply
      const totalSupply = await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: contracts.default[31337].NFT.abi,
        functionName: "tokenCount",
      });

      console.log(`📊 Total Supply: ${totalSupply}`);
      console.log(`📊 Expected Token IDs: 1 to ${totalSupply}`);

      // Check each token ID and its owner
      const tokenOwners = new Map();
      const duplicateTokens = [];

      for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
        try {
          const owner = await publicClient.readContract({
            address: nftAddress as `0x${string}`,
            abi: contracts.default[31337].NFT.abi,
            functionName: "ownerOf",
            args: [BigInt(tokenId)],
          });

          console.log(`Token ${tokenId}: Owner = ${owner}`);

          // Check for duplicates
          if (tokenOwners.has(owner)) {
            const existingTokenId = tokenOwners.get(owner);
            duplicateTokens.push({ tokenId, owner, existingTokenId });
            console.log(`⚠️  DUPLICATE OWNER: Token ${tokenId} and Token ${existingTokenId} both owned by ${owner}`);
          } else {
            tokenOwners.set(owner, tokenId);
          }

          // Get token URI to check metadata
          try {
            const tokenURI = await publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: contracts.default[31337].NFT.abi,
              functionName: "tokenURI",
              args: [BigInt(tokenId)],
            });

            if (tokenURI.startsWith("data:application/json;base64,")) {
              const base64Data = tokenURI.split(",")[1];
              const jsonString = atob(base64Data);
              const metadata = JSON.parse(jsonString);
              console.log(`  Metadata: Name="${metadata.name}", MatchID="${metadata.attributes?.matchId}"`);
            }
          } catch (uriError) {
            console.log(`  Error getting token URI:`, uriError);
          }
        } catch (error) {
          console.log(`❌ Error checking token ${tokenId}:`, error);
        }
      }

      // Summary
      console.log("\n📋 SUMMARY:");
      console.log(`Total tokens: ${totalSupply}`);
      console.log(`Unique owners: ${tokenOwners.size}`);
      console.log(`Duplicate tokens: ${duplicateTokens.length}`);

      if (duplicateTokens.length > 0) {
        console.log("⚠️  TOKEN COLLISION ISSUES FOUND:");
        duplicateTokens.forEach(dup => {
          console.log(`  - Token ${dup.tokenId} and Token ${dup.existingTokenId} both owned by ${dup.owner}`);
        });
      } else {
        console.log("✅ No token collisions detected");
      }

      console.log("=".repeat(50));
      console.log("🔍 TOKEN COLLISION DEBUG COMPLETE");
    } catch (error) {
      console.log("❌ Token collision debug error:", error);
    }
  }, []);

  // Debug function to troubleshoot marketplace issues
  const debugMarketplace = useCallback(async () => {
    console.log("🔍 DEBUGGING MARKETPLACE ISSUES");
    console.log("=".repeat(50));

    try {
      const { createPublicClient, http } = await import("viem");
      const { localhost } = await import("viem/chains");

      const publicClient = createPublicClient({
        chain: localhost,
        transport: http("http://127.0.0.1:8545"),
      });

      const contracts = await import("~~/contracts/deployedContracts");
      const nftAddress = contracts.default[31337].NFT.address;
      const marketplaceAddress = contracts.default[31337].Marketplace.address;

      console.log(`📊 Contract Addresses:`);
      console.log(`  NFT: ${nftAddress}`);
      console.log(`  Marketplace: ${marketplaceAddress}`);
      console.log(`  Connected Wallet: ${connectedAddress}`);

      // Check total NFT supply
      const totalSupply = await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: contracts.default[31337].NFT.abi,
        functionName: "tokenCount",
      });

      console.log(`📊 Total NFT Supply: ${totalSupply}`);

      // Check each token ID and its owner
      console.log(`\n🔍 TOKEN OWNERSHIP ANALYSIS:`);
      for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
        try {
          const owner = await publicClient.readContract({
            address: nftAddress as `0x${string}`,
            abi: contracts.default[31337].NFT.abi,
            functionName: "ownerOf",
            args: [BigInt(tokenId)],
          });

          const isOwnedByUser = owner.toLowerCase() === connectedAddress?.toLowerCase();
          const isInMarketplace = owner.toLowerCase() === marketplaceAddress.toLowerCase();

          console.log(`  Token ${tokenId}: Owner=${owner}`);
          console.log(`    Owned by User: ${isOwnedByUser ? "✅ YES" : "❌ NO"}`);
          console.log(`    In Marketplace: ${isInMarketplace ? "✅ YES" : "❌ NO"}`);

          if (isOwnedByUser && isInMarketplace) {
            console.log(`    ⚠️  CONFLICT: Token ${tokenId} is both owned by user AND in marketplace!`);
          }
        } catch (error) {
          console.log(`  ❌ Error checking token ${tokenId}:`, error);
        }
      }

      // Check marketplace item count
      const itemCount = await publicClient.readContract({
        address: marketplaceAddress as `0x${string}`,
        abi: contracts.default[31337].Marketplace.abi,
        functionName: "itemCount",
      });

      console.log(`\n📊 Marketplace Item Count: ${itemCount}`);

      // Check each marketplace item
      for (let i = 1; i <= Number(itemCount); i++) {
        try {
          const item = await publicClient.readContract({
            address: marketplaceAddress as `0x${string}`,
            abi: contracts.default[31337].Marketplace.abi,
            functionName: "items",
            args: [BigInt(i)],
          });

          console.log(`\n📦 Marketplace Item ${i}:`);
          console.log(`  Item ID: ${item[0]}`);
          console.log(`  NFT Contract: ${item[1]}`);
          console.log(`  Token ID: ${item[2]}`);
          console.log(`  Price: ${item[3]} wei (${formatEther(item[3])} ETH)`);
          console.log(`  Seller: ${item[4]}`);
          console.log(`  Sold: ${item[5]}`);

          // Check if NFT is actually in marketplace
          const owner = await publicClient.readContract({
            address: nftAddress as `0x${string}`,
            abi: contracts.default[31337].NFT.abi,
            functionName: "ownerOf",
            args: [BigInt(item[2])],
          });

          const isInMarketplace = owner.toLowerCase() === marketplaceAddress.toLowerCase();
          const isListedByUser = item[4].toLowerCase() === connectedAddress?.toLowerCase();

          console.log(`  Actual Owner: ${owner}`);
          console.log(`  In Marketplace: ${isInMarketplace ? "✅ YES" : "❌ NO"}`);
          console.log(`  Listed by User: ${isListedByUser ? "✅ YES" : "❌ NO"}`);

          if (isListedByUser && !isInMarketplace) {
            console.log(`  ⚠️  ISSUE: Item listed by user but NFT not in marketplace contract!`);
          }
        } catch (error) {
          console.log(`❌ Error checking item ${i}:`, error);
        }
      }

      // Check localStorage data
      console.log(`\n📁 LOCALSTORAGE ANALYSIS:`);
      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter(key => key.startsWith("nft-") && !key.includes("metadata"));
      console.log(`  Found ${nftKeys.length} NFT keys in localStorage`);

      nftKeys.forEach(key => {
        try {
          const nftData = JSON.parse(localStorage.getItem(key) || "{}");
          console.log(`  ${key}: Token ID=${nftData.tokenId}, Creator=${nftData.creator}, Name="${nftData.name}"`);
        } catch (error) {
          console.log(`  ❌ Error parsing ${key}:`, error);
        }
      });

      console.log("=".repeat(50));
      console.log("🔍 MARKETPLACE DEBUG COMPLETE");
    } catch (error) {
      console.log("❌ Marketplace debug error:", error);
    }
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
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={loadOwnedNFTs} title="Refresh NFT data">
            🔄 Refresh
          </button>
          <button className="btn btn-outline btn-sm" onClick={debugTokenMismatches} title="Debug token ID mismatches">
            🔍 Debug
          </button>
          <button className="btn btn-outline btn-sm" onClick={cleanIncorrectData} title="Clean incorrect data">
            🧹 Clean
          </button>
          <button className="btn btn-outline btn-sm" onClick={debugTokenCollision} title="Debug token ID collision">
            🔍 Token Debug
          </button>
          <button className="btn btn-outline btn-sm" onClick={debugMarketplace} title="Debug marketplace issues">
            🔍 Market Debug
          </button>
        </div>
      </div>
      {ownedNFTs.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
          <p className="text-gray-600">You don&apos;t own any NFTs in your wallet</p>
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
                  <strong>Listing Transaction:</strong>{" "}
                  {selectedNFT.transactionHash === "blockchain-recovered" ? (
                    <span className="text-gray-500">Not available (recovered from blockchain)</span>
                  ) : (
                    <a
                      href={`/blockexplorer/transaction/${selectedNFT.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                      title="View the transaction that listed this NFT to the marketplace"
                    >
                      {formatTransactionHash(selectedNFT.transactionHash)}
                    </a>
                  )}
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
