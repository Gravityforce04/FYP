"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
// import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  // useDeployedContractInfo,
  // useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// IPFS configuration - using mock approach for browser compatibility

const CreateMint = () => {
  const { address: connectedAddress } = useAccount();
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    matchId: "",
    price: "",
  });
  const [localHistory, setLocalHistory] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract hooks
  // const { data: nftContractData } = useDeployedContractInfo("NFT");
  // const { data: marketplaceContractData } = useDeployedContractInfo("Marketplace");

  const { writeContractAsync: writeNFTAsync } = useScaffoldWriteContract("NFT");
  // const { writeContractAsync: writeMarketplaceAsync } = useScaffoldWriteContract("Marketplace");

  // Read total supply to get next token ID (approximation)
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "NFT",
    functionName: "tokenCount",
  });

  // Get created NFTs history
  // Get created NFTs history
  // const { data: transferEvents } = useScaffoldEventHistory({
  //   contractName: "NFT",
  //   eventName: "Transfer",
  //   fromBlock: 0n,
  //   filters: { to: connectedAddress as string | undefined },
  //   blockData: true,
  //   transactionData: true,
  //   receiptData: true,
  //   enabled: !!connectedAddress,
  // });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Load local history on mount
  useEffect(() => {
    const saved = localStorage.getItem("created-nfts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sort by newest first
        parsed.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLocalHistory(parsed);
      } catch (e) {
        console.error("Error parsing local history", e);
      }
    }
  }, []);

  // Mock IPFS upload - in a real app this would upload to Pinata or similar
  const uploadToIPFS = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Resize image using Canvas
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Get highly compressed base64 string
          const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
          console.log("Resized image size:", dataUrl.length, "bytes");
          setImagePreview(dataUrl);
          setIsUploading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
      notification.error("Error uploading file");
    }
  };

  const handleMint = async () => {
    if (!formData.name || !formData.description || !formData.matchId || !imagePreview) {
      notification.error("Please fill in all fields and upload an image");
      return;
    }

    try {
      // 1. Create metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imagePreview, // In production, this would be an IPFS URL
        attributes: [
          { trait_type: "Match ID", value: formData.matchId },
          { trait_type: "Creator", value: connectedAddress },
        ],
      };

      // Mock uploading metadata to IPFS
      // In a real app, we would upload the JSON to IPFS and get the URI
      // For this demo, we'll use a data URI or a placeholder
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

      console.log("TokenURI size:", tokenURI.length, "bytes");

      if (tokenURI.length > 50000) {
        notification.warning("Image is still too large for on-chain storage. Please try a simpler image.");
        return;
      }

      // 2. Mint NFT
      const tx = await writeNFTAsync({
        functionName: "mint",
        args: [tokenURI],
      });

      if (tx) {
        notification.success("NFT Minted Successfully!");

        // Save to local storage for demo purposes (since we can't easily index the graph here)
        const createdNFTs = JSON.parse(localStorage.getItem("created-nfts") || "[]");
        const newItem = {
          id: totalSupply ? Number(totalSupply) + 1 : Date.now(),
          ...metadata,
          txHash: tx,
          createdAt: new Date().toISOString(),
        };
        createdNFTs.push(newItem);
        localStorage.setItem("created-nfts", JSON.stringify(createdNFTs));

        // Update local state
        setLocalHistory(prev => [newItem, ...prev]);

        // Reset form
        setFormData({
          name: "",
          description: "",
          matchId: "",
          price: "",
        });
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      notification.error("Error minting NFT");
    }
  };

  // const handleList = async (tokenId: bigint) => {
  //   if (!formData.price) {
  //     notification.error("Please enter a price to list");
  //     return;
  //   }

  //   try {
  //     const priceInWei = parseEther(formData.price);

  //     // 1. Approve Marketplace to spend NFT
  //     await writeNFTAsync({
  //       functionName: "approve",
  //       args: [marketplaceContractData?.address, tokenId],
  //     });

  //     notification.info("Approval successful, listing item...");

  //     // 2. List item on Marketplace
  //     await writeMarketplaceAsync({
  //       functionName: "listNFT",
  //       args: [nftContractData?.address, tokenId, priceInWei],
  //     });

  //     notification.success("NFT Listed Successfully!");
  //   } catch (error) {
  //     console.error("Error listing NFT:", error);
  //     notification.error("Error listing NFT");
  //   }
  // };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <div className="mb-8">
          <Link href="/create" className="btn btn-ghost gap-2 pl-0 hover:bg-transparent">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Guide
          </Link>
          <h1 className="text-4xl font-bold mt-4">Mint Your Robot NFT</h1>
          <p className="text-base-content/70 mt-2">Create a unique digital asset for your autonomous robot.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Minting Form */}
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h2 className="card-title mb-4">NFT Details</h2>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Robot Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Speedster X1"
                  className="input input-bordered w-full"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control w-full mt-4">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Describe your robot's capabilities..."
                  className="textarea textarea-bordered h-24"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="form-control w-full mt-4">
                <label className="label">
                  <span className="label-text">Match ID (Verification)</span>
                </label>
                <input
                  type="text"
                  name="matchId"
                  placeholder="Enter verified match ID"
                  className="input input-bordered w-full"
                  value={formData.matchId}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control w-full mt-4">
                <label className="label">
                  <span className="label-text">Robot Image</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="file-input file-input-bordered w-full"
                  accept="image/*"
                  onChange={uploadToIPFS}
                />
              </div>

              {imagePreview && (
                <div className="mt-4 relative h-48 w-full rounded-lg overflow-hidden border border-base-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="card-actions justify-end mt-6">
                <button
                  className={`btn btn-primary w-full ${isUploading ? "loading" : ""}`}
                  onClick={handleMint}
                  disabled={isUploading}
                >
                  Mint NFT
                </button>
              </div>
            </div>
          </div>

          {/* History / Status */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <h2 className="card-title mb-4">Your Recent Mints</h2>
                {localHistory.length > 0 ? (
                  <div className="space-y-4">
                    {localHistory.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
                        <div className="w-12 h-12 bg-base-300 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🤖</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{item.name}</p>
                          <p className="text-xs text-base-content/60 truncate">
                            Match ID: {item.attributes?.find((a: any) => a.trait_type === "Match ID")?.value}
                          </p>
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${item.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs link link-primary truncate block"
                          >
                            View on Arbiscan
                          </a>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="badge badge-sm badge-success">Minted</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-base-content/60">
                    <p>No NFTs minted yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="alert alert-info shadow-lg">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current flex-shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>
                  Only verified match participants can mint competition NFTs. Ensure your Match ID is correct.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMint;
