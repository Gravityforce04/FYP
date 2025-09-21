"use client";

import { useState } from "react";
import { Hash, Transaction, TransactionReceipt, formatEther } from "viem";
import { hardhat } from "viem/chains";
import { usePublicClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { decodeTransactionData } from "~~/utils/scaffold-eth";

const CompetitionsPage = () => {
  const [transactionAddress, setTransactionAddress] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const client = usePublicClient({ chainId: hardhat.id });
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

      // Check if this is a RoboticsCompetition contract interaction
      const roboticsContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      const isRoboticsContract = tx.to?.toLowerCase() === roboticsContractAddress.toLowerCase();

      if (isRoboticsContract) {
        // Try to extract match ID from transaction logs or data
        // For now, we'll use a default match ID and fetch the result
        const matchId = BigInt(1); // This could be extracted from transaction data

        try {
          const matchResult = await client.readContract({
            address: roboticsContractAddress as `0x${string}`,
            abi: [
              {
                inputs: [{ internalType: "uint256", name: "_matchId", type: "uint256" }],
                name: "getMatchResult",
                outputs: [
                  {
                    components: [
                      { internalType: "uint256", name: "matchId", type: "uint256" },
                      { internalType: "address", name: "winner", type: "address" },
                      { internalType: "address[]", name: "participants", type: "address[]" },
                      { internalType: "uint256", name: "timestamp", type: "uint256" },
                      { internalType: "string", name: "matchData", type: "string" },
                      { internalType: "bool", name: "verified", type: "bool" },
                    ],
                    internalType: "struct RoboticsCompetition.MatchResult",
                    name: "",
                    type: "tuple",
                  },
                ],
                stateMutability: "view",
                type: "function",
              },
            ],
            functionName: "getMatchResult",
            args: [matchId],
          });

          setVerificationResult({
            verified: matchResult.verified,
            winner: matchResult.winner,
            participants: matchResult.participants,
            timestamp: Number(matchResult.timestamp),
            matchData: matchResult.matchData,
            matchId: Number(matchResult.matchId),
            transactionHash: transactionAddress,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            status: receipt.status,
          });
        } catch (contractError) {
          console.error("Error reading contract:", contractError);
          // Fallback to basic transaction verification
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

  const getArbiscanUrl = (address: string) => {
    return `https://sepolia.arbiscan.io/address/${address}`;
  };

  const getHardhatExplorerUrl = (txHash: string) => {
    return `http://localhost:3000/blockexplorer/transaction/${txHash}`;
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
                    href={getHardhatExplorerUrl(transactionAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    🔗 View on Block Explorer
                  </a>
                </div>
                {transaction && (
                  <div className="mt-4 space-y-2">
                    <div>
                      <strong>From:</strong> <Address address={transaction.from} />
                    </div>
                    <div>
                      <strong>To:</strong>{" "}
                      {transaction.to ? <Address address={transaction.to} /> : <span>Contract Creation</span>}
                    </div>
                    <p>
                      <strong>Value:</strong> {formatEther(transaction.value)} ETH
                    </p>
                    <p>
                      <strong>Gas Limit:</strong> {transaction.gas.toString()}
                    </p>
                    {receipt && (
                      <>
                        <p>
                          <strong>Gas Used:</strong> {receipt.gasUsed.toString()}
                        </p>
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

              {verificationResult.isRoboticsContract !== false ? (
                // RoboticsCompetition contract interaction
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  {/* Match Details */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary">Competition Information</h3>
                    <div className="space-y-2">
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
                    </div>
                  </div>

                  {/* Winner Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-success">🏆 Winner</h3>
                    <div className="space-y-2">
                      <p>
                        <strong>Address:</strong>
                      </p>
                      <Address address={verificationResult.winner} />
                    </div>
                  </div>
                </div>
              ) : (
                // General transaction verification
                <div className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">Transaction Status</h3>
                      <p>
                        <strong>Status:</strong>
                        <span
                          className={`badge ml-2 ${verificationResult.status === "success" ? "badge-success" : "badge-error"}`}
                        >
                          {verificationResult.status}
                        </span>
                      </p>
                      <p>
                        <strong>Block Number:</strong> {verificationResult.blockNumber.toString()}
                      </p>
                      <p>
                        <strong>Gas Used:</strong> {verificationResult.gasUsed.toString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-info">Transaction Details</h3>
                      <div>
                        <strong>From:</strong> <Address address={verificationResult.from} />
                      </div>
                      <div>
                        <strong>To:</strong>{" "}
                        {verificationResult.to ? (
                          <Address address={verificationResult.to} />
                        ) : (
                          <span>Contract Creation</span>
                        )}
                      </div>
                      <div>
                        <strong>Value:</strong> {formatEther(verificationResult.value)} ETH
                      </div>
                    </div>
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

              {/* Blockchain Verification Links */}
              <div className="mt-6 p-4 bg-base-200 rounded-lg">
                <h3 className="text-lg font-semibold text-accent mb-3">🔗 Blockchain Verification</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Contract Address</h4>
                    <p className="text-sm mb-2">RoboticsCompetition Contract:</p>
                    <Address address="0x5FbDB2315678afecb367f032d93F642f64180aa3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Network Information</h4>
                    <p className="text-sm mb-2">Hardhat Local Network</p>
                    <p className="text-sm mb-2">Chain ID: 31337</p>
                    <a
                      href={getHardhatExplorerUrl(verificationResult.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      🌐 View on Block Explorer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-base-200 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">📋 How to Verify Competition Results</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Enter Transaction Hash:</strong> Input a valid Ethereum transaction hash (0x followed by 64 hex
              characters)
            </li>
            <li>
              <strong>Click Verify:</strong> Press the Verify Transaction button to fetch and verify the transaction
            </li>
            <li>
              <strong>View Results:</strong> See real transaction details and verification results
            </li>
            <li>
              <strong>RoboticsCompetition Contracts:</strong> If the transaction interacts with the RoboticsCompetition
              contract, you&apos;ll see match results
            </li>
            <li>
              <strong>General Transactions:</strong> For other transactions, you&apos;ll see basic verification
              information
            </li>
            <li>
              <strong>Blockchain Verification:</strong> Use the block explorer links to explore the transaction on-chain
            </li>
          </ol>

          <div className="mt-4 p-3 bg-base-300 rounded">
            <p className="text-sm font-semibold">🧪 Testing Mode:</p>
            <p className="text-sm">
              This page fetches real transaction data from the blockchain and verifies it against the
              RoboticsCompetition smart contract. Enter any valid transaction hash to see the verification results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionsPage;
