"use client";

import { useState } from "react";
import { Hash, decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import { BlockchainScanner101 } from "~~/components/BlockchainScanner101";
// import { Address } from "~~/components/scaffold-eth"; // Removed unused import
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

// import { decodeTransactionData } from "~~/utils/scaffold-eth"; // Removed unused import

const CompetitionsPage = () => {
  const [transactionAddress, setTransactionAddress] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Use the configured target network (Arbitrum Sepolia)
  const targetNetwork = scaffoldConfig.targetNetworks[0];
  const client = usePublicClient({ chainId: targetNetwork.id });

  const isValidTransactionHash = (hash: string) => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  };

  const handleVerification = async () => {
    if (!transactionAddress) {
      setError("Please enter a Transaction Hash");
      return;
    }

    if (!isValidTransactionHash(transactionAddress)) {
      setError("Invalid transaction hash format. Must be 66 characters starting with 0x");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      if (!client) {
        throw new Error("Client not available");
      }

      // Fetch transaction data
      const tx = await client.getTransaction({ hash: transactionAddress as Hash });
      const receipt = await client.getTransactionReceipt({ hash: transactionAddress as Hash });

      if (!tx || !receipt) {
        throw new Error("Transaction not found");
      }

      // const transactionWithDecodedData = decodeTransactionData(tx);
      // setTransaction(transactionWithDecodedData); // Removed unused state
      // setReceipt(receipt); // Removed unused state

      // Get RoboticsCompetition contract address for the current chain
      const chainId = targetNetwork.id;
      // @ts-ignore - Dynamic access to deployedContracts
      const deployedContract = deployedContracts[chainId]?.RoboticsCompetition;
      const roboticsContractAddress = deployedContract?.address;

      if (!roboticsContractAddress) {
        console.warn("RoboticsCompetition contract not found for this chain");
      }

      const isRoboticsContract =
        roboticsContractAddress && tx.to?.toLowerCase() === roboticsContractAddress.toLowerCase();

      if (isRoboticsContract) {
        let matchId = BigInt(0);
        let foundMatchId = false;

        // Try to extract match ID from transaction logs
        for (const log of receipt.logs) {
          try {
            if (log.address.toLowerCase() === roboticsContractAddress.toLowerCase()) {
              const decodedLog = decodeEventLog({
                abi: deployedContract.abi,
                data: log.data,
                topics: log.topics,
              });

              if (decodedLog.eventName === "MatchResultRecorded") {
                // @ts-ignore
                matchId = decodedLog.args.matchId;
                foundMatchId = true;
                break;
              }
            }
          } catch (e) {
            console.log("Error parsing log:", e);
          }
        }

        if (foundMatchId) {
          try {
            const matchResult = await client.readContract({
              address: roboticsContractAddress as `0x${string}`,
              abi: deployedContract.abi,
              functionName: "getMatchResult",
              args: [matchId],
            });

            // @ts-ignore
            setVerificationResult({
              verified: matchResult.verified,
              // @ts-ignore
              winner: matchResult.winner,
              // @ts-ignore
              participants: matchResult.participants,
              // @ts-ignore
              timestamp: Number(matchResult.timestamp),
              // @ts-ignore
              matchData: matchResult.matchData,
              // @ts-ignore
              matchId: Number(matchResult.matchId),
              transactionHash: transactionAddress,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed,
              status: receipt.status,
              isRoboticsContract: true,
              from: tx.from,
              to: tx.to,
              value: tx.value,
            });
          } catch (contractError) {
            console.error("Error reading contract:", contractError);
            throw new Error("Failed to read match result from contract");
          }
        } else {
          // Transaction to contract but no MatchResultRecorded event found
          setVerificationResult({
            verified: receipt.status === "success",
            transactionHash: transactionAddress,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            status: receipt.status,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            isRoboticsContract: true,
            note: "Transaction interacted with contract but no MatchResultRecorded event was found.",
          });
        }
      } else {
        // Not a RoboticsCompetition contract interaction
        setVerificationResult({
          verified: receipt.status === "success",
          transactionHash: transactionAddress,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          status: receipt.status,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          isRoboticsContract: false,
        });
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-[90%] pt-24 pb-20">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Match Validator
        </h1>
        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
          Verify the integrity of any match on the Arbitrum network. Enter a transaction hash to decode and validate the
          results.
        </p>
      </div>

      {/* Top Section: Verify Transaction (Full Width) */}
      <div className="w-full mb-16">
        <div className="card bg-transparent border border-base-content/10 shadow-xl">
          <div className="card-body max-w-4xl mx-auto w-full text-center">
            <h2 className="card-title text-2xl mb-6 justify-center">Verify Transaction</h2>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold">Transaction Hash</span>
              </label>
              <div className="join max-w-lg mx-auto w-full">
                <input
                  type="text"
                  placeholder="0x..."
                  className="input input-bordered join-item w-full font-mono text-sm"
                  value={transactionAddress}
                  onChange={e => setTransactionAddress(e.target.value)}
                />
                <button
                  className={`btn btn-primary join-item ${isVerifying ? "loading" : ""}`}
                  onClick={handleVerification}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error shadow-lg mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current flex-shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Verification Result Component (Appears below input) */}
        {verificationResult && (
          <div className="card bg-transparent shadow-xl border border-success/20 animate-fade-in-up mt-8">
            <div className="card-body">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-success">Match Verified</h3>
                  <p className="text-base-content/70">This match has been cryptographically proven on-chain.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-transparent border border-base-content/10 rounded-xl">
                  <div className="text-sm opacity-60 mb-1">Match ID</div>
                  <div className="text-xl font-mono font-bold">{verificationResult.matchId}</div>
                </div>
                <div className="p-4 bg-transparent border border-base-content/10 rounded-xl">
                  <div className="text-sm opacity-60 mb-1">Winner</div>
                  <div className="text-xl font-bold text-primary">{verificationResult.winner}</div>
                </div>
              </div>

              <div className="divider">Raw Data</div>

              <div className="mockup-code bg-transparent border border-base-content/10 text-base-content text-xs">
                <pre data-prefix=">">
                  <code>Timestamp: {verificationResult.timestamp}</code>
                </pre>
                <pre data-prefix=">">
                  <code>Block: {verificationResult.blockNumber}</code>
                </pre>
                <pre data-prefix=">">
                  <code>Gas Used: {verificationResult.gasUsed}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Educational Content (Grid) */}
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Scanner */}
        <div className="space-y-8">
          <BlockchainScanner101 />
        </div>

        {/* Right Column: How it Works & Links */}
        <div className="space-y-8">
          {/* How Validation Works - Floating Boxes */}
          <div>
            <h3 className="text-2xl font-bold mb-6">How Validation Works</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Block Hashing",
                  desc: "Unique fingerprint for every match.",
                  icon: "🔒",
                  color: "border-primary/20 bg-primary/5",
                },
                {
                  title: "Merkle Tree",
                  desc: "Efficiently verifies integrity of all data.",
                  icon: "🌳",
                  color: "border-secondary/20 bg-secondary/5",
                },
                {
                  title: "Consensus",
                  desc: "Network agreement on valid results.",
                  icon: "🤝",
                  color: "border-accent/20 bg-accent/5",
                },
                {
                  title: "Immutable Ledger",
                  desc: "Permanent, unchangeable history.",
                  icon: "⛓️",
                  color: "border-success/20 bg-success/5",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border ${item.color} shadow-lg hover:shadow-xl transition-shadow cursor-default`}
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                  <p className="text-sm opacity-70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* External Links */}
          <div className="card bg-transparent border-base-300 border">
            <div className="card-body">
              <h3 className="card-title text-lg">External Verification</h3>
              <p className="text-sm opacity-70 mb-4">Cross-reference this transaction on official block explorers.</p>
              <div className="flex gap-2">
                <a
                  href={`https://sepolia.arbiscan.io/tx/${transactionAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm gap-2"
                >
                  Arbiscan
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionsPage;
