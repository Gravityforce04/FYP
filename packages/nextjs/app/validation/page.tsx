"use client";

import { useState } from "react";
import { Hash, Transaction, TransactionReceipt, decodeEventLog, formatEther } from "viem";
import { usePublicClient } from "wagmi";
import { BlockchainScanner101 } from "~~/components/BlockchainScanner101";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import { decodeTransactionData } from "~~/utils/scaffold-eth";

const CompetitionsPage = () => {
  const [transactionAddress, setTransactionAddress] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Use the configured target network (Arbitrum Sepolia)
  const targetNetwork = scaffoldConfig.targetNetworks[0];
  const client = usePublicClient({ chainId: targetNetwork.id });

  const [transaction, setTransaction] = useState<Transaction>();
  const [receipt, setReceipt] = useState<TransactionReceipt>();

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

      const transactionWithDecodedData = decodeTransactionData(tx);
      setTransaction(transactionWithDecodedData);
      setReceipt(receipt);

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

  const getArbiscanUrl = (address: string, type: "address" | "tx" = "address") => {
    return `https://sepolia.arbiscan.io/${type}/${address}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">🏆 Competition Results Verification</h1>

      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">Enter Transaction Address for verification:</span>
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter Transaction Hash (0x...)"
                  className="input input-bordered flex-1"
                  value={transactionAddress}
                  onChange={e => setTransactionAddress(e.target.value)}
                />
                <button
                  className={`btn btn-primary ${isVerifying ? "loading" : ""}`}
                  onClick={handleVerification}
                  disabled={!transactionAddress || isVerifying}
                >
                  {isVerifying ? "Verifying..." : "✅ Verify Transaction"}
                </button>
              </div>
              {transactionAddress && !isValidTransactionHash(transactionAddress) && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    Invalid transaction hash format. Must be 66 characters starting with 0x
                  </span>
                </label>
              )}
              {error && (
                <label className="label">
                  <span className="label-text-alt text-error">{error}</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Information */}
        {transactionAddress && isValidTransactionHash(transactionAddress) && (
          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h2 className="card-title text-xl">🔗 Transaction Details</h2>
              <div className="space-y-3">
                <p>
                  <strong>Transaction Hash:</strong>
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-base-300 px-2 py-1 rounded text-sm break-all">{transactionAddress}</code>
                  <a
                    href={getArbiscanUrl(transactionAddress, "tx")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    🔗 View on Arbiscan
                  </a>
                </div>
                {transaction && (
                  <div className="mt-4 space-y-2">
                    <div>
                      <strong>From (Sender):</strong> <Address address={transaction.from} />
                    </div>
                    <div>
                      <strong>To (Receiver):</strong>{" "}
                      {transaction.to ? <Address address={transaction.to} /> : <span>Contract Creation</span>}
                    </div>
                    <p>
                      <strong>Value:</strong> {formatEther(transaction.value)} ETH
                    </p>
                    {receipt && (
                      <>
                        <p>
                          <strong>Block Number:</strong> {receipt.blockNumber.toString()}
                        </p>
                        <p>
                          <strong>Status:</strong>
                          <span
                            className={`badge ml-2 ${receipt.status === "success" ? "badge-success" : "badge-error"}`}
                          >
                            {receipt.status}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h2 className="card-title text-2xl">
                {verificationResult.verified ? "✅ Transaction Verified" : "❌ Transaction Failed"}
              </h2>

              {verificationResult.isRoboticsContract ? (
                // RoboticsCompetition contract interaction
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  {/* Match Details */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary">Competition Information</h3>
                    <div className="space-y-2">
                      {verificationResult.matchId !== undefined ? (
                        <>
                          <p>
                            <strong>Status:</strong> <span className="badge badge-success">Verified</span>
                          </p>
                          <p>
                            <strong>Match ID:</strong> {verificationResult.matchId}
                          </p>
                          <p>
                            <strong>Timestamp:</strong>{" "}
                            {new Date(Number(verificationResult.timestamp) * 1000).toLocaleString()}
                          </p>
                          <p>
                            <strong>Match Data:</strong> {verificationResult.matchData}
                          </p>
                        </>
                      ) : (
                        <p className="text-warning">{verificationResult.note}</p>
                      )}
                    </div>
                  </div>

                  {/* Winner Information */}
                  {verificationResult.winner && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-success">🏆 Winner</h3>
                      <div className="space-y-2">
                        <p>
                          <strong>Address:</strong>
                        </p>
                        <Address address={verificationResult.winner} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // General transaction verification
                <div className="space-y-4 mt-4">
                  <div className="alert alert-info">
                    <span>This transaction is not a RoboticsCompetition match record.</span>
                  </div>
                </div>
              )}

              {/* Participants List - Only for RoboticsCompetition contracts */}
              {verificationResult.participants && verificationResult.participants.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-info mb-3">👥 Participants</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {verificationResult.participants.map((participant: string, index: number) => (
                      <div key={index} className="card bg-base-200 p-3">
                        <div className="flex items-center justify-between">
                          <Address address={participant} />
                          {participant === verificationResult.winner && (
                            <span className="badge badge-success badge-sm">Winner</span>
                          )}
                        </div>
                        <a
                          href={getArbiscanUrl(participant)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-xs mt-2"
                        >
                          🔗 Arbiscan
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Educational Scanner */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Why Arbitrum?</h2>
            <div className="space-y-4">
              {[
                {
                  title: "L2 Scaling Solution",
                  desc: "Arbitrum is a Layer 2 scaling solution for Ethereum, offering faster transactions and lower fees while maintaining Ethereum's security.",
                },
                {
                  title: "Optimistic Rollups",
                  desc: "It uses Optimistic Rollups to bundle multiple transactions into a single proof, significantly reducing gas costs.",
                },
                {
                  title: "Arbiscan Explorer",
                  desc: "Arbiscan is the block explorer for Arbitrum, allowing you to verify transactions, view contract code, and track token transfers transparently.",
                },
              ].map((item, index) => (
                <div key={index} className="collapse collapse-arrow bg-base-200 hover:bg-base-300 transition-colors">
                  <input type="radio" name="arbitrum-accordion" defaultChecked={index === 0} />
                  <div className="collapse-title text-xl font-medium">{item.title}</div>
                  <div className="collapse-content">
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <BlockchainScanner101 />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionsPage;
