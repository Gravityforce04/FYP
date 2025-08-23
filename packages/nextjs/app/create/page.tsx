"use client";

import { useState } from "react";
import { Address } from "~~/components/scaffold-eth";
// import { parseEther } from 'viem';
// import { useScaffoldWriteContract} from '~~/hooks/scaffold-eth';
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Create = () => {
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [matchId, setMatchId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Use Scaffold-ETH hooks for contract interactions
  // const { writeContractAsync: writeRoboticsContract } = useScaffoldWriteContract({
  //   contractName: "RoboticsCompetition"
  // });

  // const { writeContractAsync: writeMarketplaceContract } = useScaffoldWriteContract({
  //   contractName: "NFTMarketplace"
  // });

  // Read match result to verify it exists
  const { data: matchResult } = useScaffoldReadContract({
    contractName: "RoboticsCompetition",
    functionName: "getMatchResult",
    args: [matchId ? BigInt(matchId) : BigInt(0)],
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

    setIsCreating(true);

    try {
      //Create metadata JSON
      // const metadata = {
      //   image,
      //   price: parseFloat(price),
      //   name,
      //   description,
      //   matchId: parseInt(matchId),
      //   attributes: [
      //     { trait_type: "Type", value: "Robotics Competition NFT" },
      //     { trait_type: "Category", value: "eSports" },
      //     { trait_type: "Match ID", value: matchId },
      //     { trait_type: "Winner", value: matchResult.winner },
      //     { trait_type: "Timestamp", value: new Date(Number(matchResult.timestamp) * 1000).toISOString() }
      //   ]
      // };

      // Mock IPFS upload for metadata
      // const mockMetadataHash = `QmMetadataHash${Date.now()}`;
      // const metadataUri = `https://ipfs.infura.io/ipfs/${mockMetadataHash}`;

      // Check if user is the winner or participant
      // const isWinner = matchResult.winner.toLowerCase() === window.ethereum?.selectedAddress?.toLowerCase();
      // const isParticipant = matchResult.participants.some(
      //   participant => participant.toLowerCase() === window.ethereum?.selectedAddress?.toLowerCase()
      // );

      // if (!isWinner && !isParticipant) {
      //   notification.error("You can only mint NFTs for matches you participated in");
      //   return;
      // }

      // Mint NFT using the appropriate function
      // if (isWinner) {
      //   await writeRoboticsContract({
      //     functionName: "mintWinnerNFT",
      //     args: [BigInt(matchId)],
      //   });
      //   notification.success("Winner NFT minted successfully!");
      // } else {
      //   await writeRoboticsContract({
      //     functionName: "mintParticipantNFT",
      //     args: [BigInt(matchId)],
      //   });
      //   notification.success("Participant NFT minted successfully!");
      // }

      // Reset form
      setImage("");
      setPrice("");
      setName("");
      setDescription("");
      setMatchId("");
    } catch (error) {
      console.log("NFT creation error: ", error);
      notification.error("Failed to create NFT. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">🎨 Create & Mint NFT</h1>

        <div className="card bg-base-100 shadow-xl">
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
                    <p className="text-sm">
                      <strong>Match #{matchId}</strong>
                    </p>
                    <p className="text-sm">
                      Winner: <Address address={matchResult.winner} />
                    </p>
                    <p className="text-sm">Status: {matchResult.verified ? "✅ Verified" : "❌ Not Verified"}</p>
                  </div>
                )}
                {matchId && !matchResult && (
                  <div className="mt-2 p-3 bg-warning rounded-lg">
                    <p className="text-sm text-warning-content">Match not found. Please check the Match ID.</p>
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
          <h3 className="text-xl font-semibold mb-4">👉 How to Create Your NFT</h3>
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
              <strong>List on Marketplace:</strong> After minting, you can list your NFT for sale.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Create;
