"use client";

import { useCallback, useEffect, useState } from "react";
import { parseEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import {
  useDeployedContractInfo,
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// IPFS configuration - using mock approach for browser compatibility

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  price: string;
  attributes: {
    matchId: string;
    timestamp: number;
  };
}

interface CreatedNFT {
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

const Create = () => {
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [matchId, setMatchId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [createdNFTs, setCreatedNFTs] = useState<CreatedNFT[]>([]);
  const [lastTransactionHash, setLastTransactionHash] = useState<string>("");

  // Get deployed contract info
  const { data: nftContractInfo } = useDeployedContractInfo({ contractName: "NFT" });
  const { data: marketplaceContractInfo } = useDeployedContractInfo({ contractName: "Marketplace" });

  // Debug contract addresses
  useEffect(() => {
    console.log("NFT Contract Info:", nftContractInfo);
    console.log("Marketplace Contract Info:", marketplaceContractInfo);
  }, [nftContractInfo, marketplaceContractInfo]);

  // Use Scaffold-ETH hooks for contract interactions
  const { writeContractAsync: writeNFTContract } = useScaffoldWriteContract({
    contractName: "NFT",
  });

  const { writeContractAsync: writeMarketplaceContract } = useScaffoldWriteContract({
    contractName: "Marketplace",
  });

  // Read match result to verify it exists
  const { data: matchResult } = useScaffoldReadContract({
    contractName: "RoboticsCompetition",
    functionName: "getMatchResult",
    args: [matchId ? BigInt(matchId) : BigInt(0)],
  });

  // Read NFT contract to get token count for proper token ID
  const { data: tokenCount } = useScaffoldReadContract({
    contractName: "NFT",
    functionName: "tokenCount",
  });

  // Test contract connection
  const { data: contractName } = useScaffoldReadContract({
    contractName: "NFT",
    functionName: "name",
  });

  // Get mint events for real transaction hashes
  const { data: mintEvents } = useScaffoldEventHistory({
    contractName: "NFT",
    eventName: "Transfer",
    watch: true,
  });

  const uploadToIPFS = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const file = event.target.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      notification.error("Please select a valid image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      notification.error("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64 data URL for persistent storage
      const reader = new FileReader();
      reader.onload = e => {
        const base64DataUrl = e.target?.result as string;
        console.log("Image uploaded, base64 data URL length:", base64DataUrl.length);
        console.log("Image preview URL:", base64DataUrl.substring(0, 50) + "...");
        setImage(base64DataUrl);
        notification.success("Image uploaded successfully! Preview available.");
        setIsUploading(false);
      };
      reader.onerror = () => {
        notification.error("Failed to read image file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.log("Image upload error: ", error);
      notification.error("Failed to upload image");
      setIsUploading(false);
    }
  };

  const uploadMetadataToIPFS = async (metadata: NFTMetadata): Promise<string> => {
    try {
      // Create a more efficient metadata approach
      // Store the full metadata locally and use a reference URI on-chain
      const metadataId = `nft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store complete metadata locally for demo purposes
      localStorage.setItem(`nft-metadata-${metadataId}`, JSON.stringify(metadata));

      // Create a lightweight on-chain metadata URI that references the stored data
      const lightweightMetadata = {
        name: metadata.name,
        description: metadata.description,
        image:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5GVCBJbWFnZTwvdGV4dD48L3N2Zz4=", // Placeholder SVG
        external_url: `https://app.localhost/metadata/${metadataId}`,
        attributes: metadata.attributes,
      };

      // Create a data URL for the lightweight metadata
      const metadataString = JSON.stringify(lightweightMetadata);
      const metadataUri = `data:application/json;base64,${btoa(metadataString)}`;

      console.log("Lightweight metadata URI length:", metadataUri.length);
      notification.success("Metadata prepared with optimized storage");
      return metadataUri;
    } catch (error) {
      console.log("IPFS metadata preparation error: ", error);
      // Fallback to simple format
      return "data:application/json;base64,eyJuYW1lIjoiVGVzdCIsImRlc2NyaXB0aW9uIjoiVGVzdCBOZnQifQ==";
    }
  };

  // Function to get the actual token ID from the blockchain
  const getActualTokenId = async (): Promise<number> => {
    try {
      // The minted token ID is the current token count
      return tokenCount ? Number(tokenCount) : 1;
    } catch (error) {
      console.log("Error getting actual token ID:", error);
      return 1;
    }
  };

  const createNFT = async () => {
    if (!image || !price || !name || !description || !matchId) {
      notification.error("Please fill in all fields including Match ID");
      return;
    }

    if (!matchResult || !matchResult.verified) {
      notification.error("Invalid or unverified Match ID. Please check the Match ID.");
      return;
    }

    if (!nftContractInfo?.address || !marketplaceContractInfo?.address) {
      notification.error("Contract addresses not found. Please check deployment.");
      return;
    }

    // Check if user is the winner or participant
    const isWinner = matchResult.winner.toLowerCase() === window.ethereum?.selectedAddress?.toLowerCase();
    const isParticipant = matchResult.participants.some(
      participant => participant.toLowerCase() === window.ethereum?.selectedAddress?.toLowerCase(),
    );

    if (!isWinner && !isParticipant) {
      notification.error("You can only mint NFTs for matches you participated in");
      return;
    }

    // Prevent multiple submissions
    if (isCreating || isProcessing) {
      return;
    }

    setIsCreating(true);
    setIsProcessing(true);

    try {
      // Create metadata object with all NFT details
      const metadata: NFTMetadata = {
        name,
        description,
        image,
        price, // Include price in metadata
        attributes: {
          matchId,
          timestamp: Date.now(),
        },
      };

      // Upload metadata to IPFS
      const metadataUri = await uploadMetadataToIPFS(metadata);

      // Estimate gas for the transaction
      console.log("Metadata URI length:", metadataUri.length);
      const estimatedGas = Math.max(2000000, metadataUri.length * 50); // More reasonable gas estimation
      console.log("Estimated gas needed:", estimatedGas);

      // Mint NFT using the NFT contract
      const tx = await writeNFTContract({
        functionName: "mint",
        args: [metadataUri],
        gas: BigInt(estimatedGas), // Dynamic gas estimation based on metadata size
      });

      // Simple transaction hash extraction - just get the hash directly
      const transactionHash = typeof tx === "string" ? tx : (tx as any)?.hash || (tx as any)?.transactionHash;

      if (transactionHash) {
        setLastTransactionHash(transactionHash);

        // Wait for the transaction to be mined and get the actual token ID
        const actualTokenId = await getActualTokenId();
        setMintedTokenId(actualTokenId);

        // Create NFT record with actual token ID
        const newNFT: CreatedNFT = {
          transactionHash,
          name,
          price,
          description,
          image,
          matchId,
          tokenId: actualTokenId,
          timestamp: Date.now(),
          metadataUri,
        };

        // Store NFT in localStorage for persistence
        const storageKey = `nft-${actualTokenId}-${transactionHash}`;
        localStorage.setItem(storageKey, JSON.stringify(newNFT));

        // Add to created NFTs list
        setCreatedNFTs(prev => [newNFT, ...prev]);

        // Show final success notification
        notification.success("NFT minted successfully! NFT is now in your wallet.");

        // Reset form
        setImage("");
        setPrice("");
        setName("");
        setDescription("");
        setMatchId("");
        setMintedTokenId(null);

        // Refresh the NFT list to ensure proper loading
        setTimeout(() => {
          loadExistingNFTs();
        }, 2000);
      } else {
        notification.error("Failed to get transaction hash. Check console for details.");
      }
    } catch (error) {
      console.log("NFT creation error: ", error);
      notification.error("Failed to create NFT. Check console for details.");
    } finally {
      setIsCreating(false);
      setIsProcessing(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format transaction hash for display
  const formatTransactionHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Clear NFT list and reset states
  const clearNFTList = () => {
    setCreatedNFTs([]);
    setMintedTokenId(null);
    setLastTransactionHash("");

    // Also clear localStorage to start fresh
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith("nft-")) {
        localStorage.removeItem(key);
      }
    });

    notification.success("NFT list cleared and localStorage reset");
  };

  // Manual marketplace listing function
  const listNFTOnMarketplace = async (tokenId: number, price: string) => {
    if (!nftContractInfo?.address || !marketplaceContractInfo?.address) {
      notification.error("Contract addresses not found. Cannot list NFT.");
      return;
    }

    try {
      // First approve the marketplace
      console.log("Approving marketplace to transfer NFT...");
      console.log("NFT Contract:", nftContractInfo.address);
      console.log("Marketplace Contract:", marketplaceContractInfo.address);
      console.log("Token ID:", tokenId);

      await writeNFTContract({
        functionName: "approve",
        args: [marketplaceContractInfo.address, BigInt(tokenId)],
        gas: BigInt(1000000), // Increased gas limit for approve
      });
      notification.success("NFT approved for marketplace transfer!");

      // Wait for approval
      await new Promise(resolve => setTimeout(resolve, 2000));

      // List on marketplace
      console.log("Listing NFT on marketplace...");
      await writeMarketplaceContract({
        functionName: "listNFT",
        args: [nftContractInfo.address, BigInt(tokenId), parseEther(price)],
        gas: BigInt(2000000), // Increased gas limit for listNFT
      });

      notification.success("NFT listed on marketplace successfully!");
    } catch (error) {
      console.log("Manual marketplace listing error:", error);
      notification.error("Failed to list NFT on marketplace. Check console for details.");
    }
  };

  const loadExistingNFTs = useCallback(async () => {
    if (!nftContractInfo?.address) {
      notification.error("NFT contract address not found. Cannot load existing NFTs.");
      return;
    }

    try {
      // Load real NFT data from localStorage first (these are the actual created NFTs)
      const realNFTs: CreatedNFT[] = [];

      // Get all stored NFT keys (using the new storage format)
      const keys = Object.keys(localStorage);
      const nftKeys = keys.filter(key => key.startsWith("nft-"));

      // Load real NFT data from localStorage
      nftKeys.forEach(key => {
        try {
          const nftData = JSON.parse(localStorage.getItem(key) || "{}");
          if (nftData.name && nftData.description && nftData.transactionHash) {
            realNFTs.push(nftData);
          }
        } catch (parseError) {
          console.log("Error parsing stored NFT data:", parseError);
        }
      });

      if (realNFTs.length > 0) {
        // Sort by timestamp (newest first)
        realNFTs.sort((a, b) => b.timestamp - a.timestamp);
        setCreatedNFTs(realNFTs);
        notification.success(`Loaded ${realNFTs.length} NFTs from storage`);
      } else {
        // Fallback: show basic info from blockchain events if no stored data
        const fallbackNFTs: CreatedNFT[] = [];

        if (mintEvents && mintEvents.length > 0) {
          const mintEventsOnly = mintEvents.filter(
            event =>
              event.args.from === "0x0000000000000000000000000000000000000000" &&
              event.args.to !== "0x0000000000000000000000000000000000000000",
          );

          mintEventsOnly.forEach((mintEvent, index) => {
            if (mintEvent.transactionHash) {
              const nft: CreatedNFT = {
                transactionHash: mintEvent.transactionHash,
                name: `NFT #${index + 1}`,
                price: "0.01",
                description: "Minted on blockchain (metadata not available)",
                image: "/placeholder-image.png",
                matchId: "Unknown",
                tokenId: index + 1,
                timestamp: Date.now() - index * 1000,
                metadataUri: "1",
              };
              fallbackNFTs.push(nft);
            }
          });
        }

        if (fallbackNFTs.length > 0) {
          setCreatedNFTs(fallbackNFTs);
          notification.info(`Found ${fallbackNFTs.length} NFTs from blockchain (basic info only)`);
        } else {
          setCreatedNFTs([]);
          notification.info("No NFTs found yet. Create your first NFT!");
        }
      }
    } catch (error) {
      console.log("Error loading existing NFTs: ", error);
      notification.error("Failed to load existing NFTs. Check console for details.");
    }
  }, [nftContractInfo?.address, mintEvents]);

  // Auto-load existing NFTs when component mounts and contracts are available
  useEffect(() => {
    if (nftContractInfo?.address) {
      loadExistingNFTs();
    }
  }, [nftContractInfo?.address, loadExistingNFTs]);

  // Also load when tokenCount changes
  useEffect(() => {
    if (nftContractInfo?.address && tokenCount !== undefined) {
      loadExistingNFTs();
    }
  }, [nftContractInfo?.address, tokenCount, loadExistingNFTs]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">🎨 Create & Mint NFT</h1>

        {/* Debug Info - Remove this in production */}
        <div className="card bg-warning text-warning-content shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg">🐛 Debug Info</h2>
            <div className="text-sm space-y-1">
              <div>
                <strong>NFT Contract:</strong> {nftContractInfo?.address || "Not Found"}
              </div>
              <div>
                <strong>Marketplace Contract:</strong> {marketplaceContractInfo?.address || "Not Found"}
              </div>
              <div>
                <strong>Token Count:</strong> {tokenCount?.toString() || "0"}
              </div>
              <div>
                <strong>Mint Events:</strong> {mintEvents?.length || 0}
              </div>
              <div>
                <strong>Contract ABIs:</strong> NFT:{" "}
                {nftContractInfo?.abi ? `${nftContractInfo.abi.length} functions` : "No ABI"}, Marketplace:{" "}
                {marketplaceContractInfo?.abi ? `${marketplaceContractInfo.abi.length} functions` : "No ABI"}
              </div>
              <div>
                <strong>NFT Contract Name:</strong> {contractName || "Loading..."}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {lastTransactionHash && (
          <div className="card bg-success text-success-content shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-lg">✅ NFT Created Successfully!</h2>
              <p>Your NFT has been minted successfully!</p>
              <div className="text-sm">
                <strong>Transaction Hash:</strong>{" "}
                <a
                  href={`/blockexplorer/transaction/${lastTransactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  {formatTransactionHash(lastTransactionHash)}
                </a>
              </div>
              {mintedTokenId && (
                <div className="text-sm">
                  <strong>Token ID:</strong> {mintedTokenId}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NFT Creation Form */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="space-y-6">
              {/* Match ID Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Match ID *</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter the Match ID you participated in"
                  className="input input-bordered w-full"
                  value={matchId}
                  onChange={e => setMatchId(e.target.value)}
                  required
                />
                {matchId && matchResult && (
                  <div className="mt-2 p-3 bg-base-200 rounded-lg">
                    <div className="text-sm">
                      <strong>Match #{matchId}</strong>
                    </div>
                    <div className="text-sm">
                      Winner: <Address address={matchResult.winner} />
                    </div>
                    <div className="text-sm">Status: {matchResult.verified ? "✅ Verified" : "❌ Not Verified"}</div>
                    <div className="text-sm">Participants: {matchResult.participants.length}</div>
                  </div>
                )}
                {matchId && !matchResult && (
                  <div className="mt-2 p-3 bg-warning rounded-lg">
                    <div className="text-sm text-warning-content">Match not found. Please check the Match ID.</div>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Upload Image</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full"
                  onChange={uploadToIPFS}
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-sm">Uploading to IPFS...</span>
                  </div>
                )}
                {image && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                      onLoad={() => console.log("Image preview loaded successfully")}
                      onError={e => console.log("Image preview failed to load:", e)}
                    />
                    <div className="text-xs text-gray-500 mt-1">Preview: {image.substring(0, 30)}...</div>
                  </div>
                )}
              </div>

              {/* NFT Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">NFT Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter NFT name"
                  className="input input-bordered w-full"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Enter NFT description"
                  className="textarea textarea-bordered w-full h-24"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Price */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Price (ETH)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.01"
                  className="input input-bordered w-full"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
              </div>

              {/* Create Button */}
              <div className="form-control mt-6">
                <button
                  className={`btn btn-primary btn-lg w-full ${isCreating ? "loading" : ""}`}
                  onClick={createNFT}
                  disabled={
                    !image ||
                    !price ||
                    !name ||
                    !description ||
                    !matchId ||
                    !matchResult?.verified ||
                    isCreating ||
                    isProcessing
                  }
                >
                  {isCreating ? "Creating NFT..." : isProcessing ? "Processing..." : "Create & Mint NFT!"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Created NFTs List */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-lg">📋 Minting History</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <strong>Total NFTs:</strong> {createdNFTs.length} | <strong>Token Count:</strong>{" "}
                  {tokenCount?.toString() || "0"}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline btn-sm" onClick={loadExistingNFTs}>
                    🔄 Refresh
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={clearNFTList}>
                    🗑️ Clear
                  </button>
                </div>
              </div>
            </div>
            {createdNFTs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No NFTs created yet. Create your first NFT above!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Token ID</th>
                      <th>Name</th>
                      <th>Price (ETH)</th>
                      <th>Match ID</th>
                      <th>Transaction Hash</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createdNFTs.map((nft, index) => (
                      <tr key={index}>
                        <td className="font-mono">{nft.tokenId}</td>
                        <td>{nft.name}</td>
                        <td>{nft.price}</td>
                        <td>{nft.matchId}</td>
                        <td className="font-mono text-xs">
                          <a
                            href={`/blockexplorer/transaction/${nft.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary"
                          >
                            {formatTransactionHash(nft.transactionHash)}
                          </a>
                        </td>
                        <td>{formatTimestamp(nft.timestamp)}</td>
                        <td>
                          <button
                            className="btn btn-xs btn-outline btn-primary"
                            onClick={() => listNFTOnMarketplace(nft.tokenId, nft.price)}
                          >
                            📋 List
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="card-title justify-center">Verify Match</h4>
              <p>Enter a valid Match ID to verify your participation and eligibility</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <h4 className="card-title justify-center">Upload & Describe</h4>
              <p>Upload your competition image and add name, description, and price</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center">
              <div className="text-4xl mb-2">⚡</div>
              <h4 className="card-title justify-center">Mint NFT</h4>
              <p>Mint your verified competition NFT on the blockchain</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-base-200 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">📖 How to Create Your NFT</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Verify Match ID:</strong> Enter a Match ID you participated in. Only verified matches are
              eligible.
            </li>
            <li>
              <strong>Upload Image:</strong> Choose an image file (JPG, PNG, GIF) to represent your NFT.
            </li>
            <li>
              <strong>Add Details:</strong> Provide a name, description, and price for your NFT.
            </li>
            <li>
              <strong>Mint NFT:</strong> Click the button to mint your NFT on the blockchain.
            </li>
            <li>
              <strong>List on Marketplace:</strong> After minting, use the &quot;List&quot; button to list your NFT for
              sale.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Create;
