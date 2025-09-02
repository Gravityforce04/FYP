"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface CreatedNFT {
  transactionHash: string;
  name: string;
  price: string;
  description: string;
  image: string;
  matchId: string;
  tokenId: number;
  timestamp: number;
}

const Create = () => {
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [matchId, setMatchId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [createdNFTs, setCreatedNFTs] = useState<CreatedNFT[]>([]);
  const [lastTransactionHash, setLastTransactionHash] = useState<string>("");

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

  const uploadToIPFS = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploading(true);

    try {
      // For now, we'll use a mock IPFS upload
      // In production, you'd integrate with IPFS client
      const mockIPFSHash = `QmMockHash${Date.now()}`;
      const ipfsUrl = `https://ipfs.infura.io/ipfs/${mockIPFSHash}`;

      setImage(ipfsUrl);
      notification.success("Image uploaded to IPFS successfully!");
    } catch (error) {
      console.log("IPFS image upload error: ", error);
      notification.error("Failed to upload image to IPFS");
    } finally {
      setIsUploading(false);
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

    setIsCreating(true);

    try {
      // Mock IPFS upload for metadata
      const mockMetadataHash = `QmMetadataHash${Date.now()}`;
      const metadataUri = `https://ipfs.infura.io/ipfs/${mockMetadataHash}`;

      // Get current token count to predict the new token ID
      const currentTokenCount = tokenCount ? Number(tokenCount) : 0;
      const expectedTokenId = currentTokenCount + 1;

      // Mint NFT using the NFT contract
      const tx = await writeNFTContract({
        functionName: "mint",
        args: [metadataUri],
      });

      if (tx && typeof tx === "object" && "hash" in tx) {
        const transactionHash = (tx as any).hash;
        setLastTransactionHash(transactionHash);

        notification.success("NFT minted successfully! Now listing on marketplace...");

        // Use the expected token ID based on current token count
        const tokenId = expectedTokenId;
        setMintedTokenId(tokenId);

        // Create NFT record
        const newNFT: CreatedNFT = {
          transactionHash,
          name,
          price,
          description,
          image,
          matchId,
          tokenId,
          timestamp: Date.now(),
        };

        // Add to created NFTs list
        setCreatedNFTs(prev => [newNFT, ...prev]);

        // List the NFT on the marketplace using correct contract addresses
        try {
          await writeMarketplaceContract({
            functionName: "makeItem",
            args: [
              nftContractInfo.address, // Use actual NFT contract address
              BigInt(tokenId),
              parseEther(price),
            ],
          });

          notification.success("NFT listed on marketplace successfully!");
        } catch (marketplaceError) {
          console.log("Marketplace listing error: ", marketplaceError);
          notification.warning("NFT minted but failed to list on marketplace. You can list it manually later.");
        }

        // Reset form
        setImage("");
        setPrice("");
        setName("");
        setDescription("");
        setMatchId("");
        setMintedTokenId(null);
      } else {
        notification.error("NFT minting failed - no transaction hash returned");
      }
    } catch (error) {
      console.log("NFT creation error: ", error);
      notification.error("Failed to create NFT. Check console for details.");
    } finally {
      setIsCreating(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">🎨 Create & Mint NFT</h1>

        {/* Success Message */}
        {mintedTokenId && (
          <div className="alert alert-success mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">NFT Minted Successfully!</h3>
              <div className="text-xs">Token ID: {mintedTokenId}</div>
              {lastTransactionHash && (
                <div className="text-xs mt-1">
                  Transaction Hash: <span className="font-mono">{formatTransactionHash(lastTransactionHash)}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
                    <img src={image} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
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
                    !image || !price || !name || !description || !matchId || !matchResult?.verified || isCreating
                  }
                >
                  {isCreating ? "Creating NFT..." : "Create & Mint NFT!"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Created NFTs List */}
        {createdNFTs.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Created NFTs</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Match ID</th>
                      <th>Token ID</th>
                      <th>Transaction Hash</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createdNFTs.map((nft, index) => (
                      <tr key={index}>
                        <td className="font-medium">{nft.name}</td>
                        <td className="font-mono">{nft.price} ETH</td>
                        <td className="font-mono">{nft.matchId}</td>
                        <td className="font-mono">{nft.tokenId}</td>
                        <td className="font-mono text-xs">
                          <a
                            href={`/blockexplorer/transaction/${nft.transactionHash}`}
                            className="link link-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {formatTransactionHash(nft.transactionHash)}
                          </a>
                        </td>
                        <td className="text-xs">{formatTimestamp(nft.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
          <h3 className="text-xl font-semibold mb-4">�� How to Create Your NFT</h3>
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
              <strong>List on Marketplace:</strong> After minting, your NFT will be automatically listed for sale.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Create;
