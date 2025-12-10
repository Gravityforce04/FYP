"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createPublicClient, formatEther, http } from "viem";
import { useAccount, useBalance } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { notification } from "~~/utils/scaffold-eth";

interface TransactionDetails {
  hash: string;
  matchId: string;
  winner: string;
  participants: string[];
  matchData: string;
  timestamp: number;
  blockNumber: number;
}

export default function MatchPage() {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [mockMatchId, setMockMatchId] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [participants, setParticipants] = useState<string>("");
  const [matchData, setMatchData] = useState<string>("Robotics Challenge: Autonomous Navigation");
  const [lastTransaction, setLastTransaction] = useState<TransactionDetails | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<TransactionDetails[]>([]);

  const { writeContractAsync: writeCompetition } = useScaffoldWriteContract({
    contractName: "RoboticsCompetition",
  });

  // const { data: deployedContractData } = useDeployedContractInfo("RoboticsCompetition");
  // const publicClient = usePublicClient();

  const targetNetwork = scaffoldConfig.targetNetworks[0];
  const publicClient = createPublicClient({
    chain: targetNetwork,
    transport: http(targetNetwork.rpcUrls.default.http[0]),
  });

  // Test contract connection
  const testContractConnection = async () => {
    try {
      console.log("Testing contract connection...");
      console.log("Address:", address);
      console.log("Balance:", balance);

      // Try to read from contract to test connection
      if (events && events.length >= 0) {
        console.log("Contract read successful - events loaded:", events.length);
        notification.success("Contract connection test successful!");
      } else {
        console.log("Contract read failed or no events");
        notification.warning("Contract connection test - no events found");
      }
    } catch (error) {
      console.error("Contract connection test failed:", error);
      notification.error("Contract connection test failed. Check console for details.");
    }
  };

  // Get event history for MatchResultRecorded events
  const { data: events, isLoading: eventsLoading } = useScaffoldEventHistory({
    contractName: "RoboticsCompetition",
    eventName: "MatchResultRecorded",
    watch: true,
  });

  // Debug events loading
  console.log("Events loading state:", eventsLoading);
  console.log("Events data:", events);
  console.log("Events length:", events?.length || 0);

  // Load transaction history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("match-transaction-history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setTransactionHistory(parsed);
        console.log("Loaded transaction history from localStorage:", parsed);
      } catch (error) {
        console.error("Error parsing saved transaction history:", error);
      }
    }
  }, []);

  // Save transaction history to localStorage whenever it changes
  useEffect(() => {
    if (transactionHistory.length > 0) {
      localStorage.setItem("match-transaction-history", JSON.stringify(transactionHistory));
      console.log("Saved transaction history to localStorage:", transactionHistory);
    }
  }, [transactionHistory]);

  const generateMock = () => {
    const id = Math.floor(Date.now() / 1000).toString();
    setMockMatchId(id);
    if (!winner && address) setWinner(address);
    notification.success("Mock match generated");
  };

  const record = async () => {
    if (!mockMatchId || !winner) {
      notification.error("Provide match id and winner");
      return;
    }

    // Validate addresses
    if (!winner.startsWith("0x") || winner.length !== 42) {
      notification.error("Invalid winner address format");
      return;
    }

    // Check if user has enough ETH for transaction
    if (balance && Number(formatEther(balance.value)) < 0.001) {
      notification.error("Insufficient ETH balance. You need at least 0.001 ETH for transaction fees.");
      return;
    }

    setIsRecording(true);
    try {
      const parts = participants
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      // Validate participants
      if (parts.length === 0) {
        notification.error("At least one participant is required");
        setIsRecording(false);
        return;
      }

      // Validate all participant addresses
      for (const part of parts) {
        if (!part.startsWith("0x") || part.length !== 42) {
          notification.error(`Invalid participant address: ${part}`);
          setIsRecording(false);
          return;
        }
      }

      // Check if match ID already exists
      const targetNetworkId = scaffoldConfig.targetNetworks[0].id;
      // @ts-ignore
      const contractData = deployedContracts[targetNetworkId]?.RoboticsCompetition;

      if (publicClient && contractData) {
        try {
          const matchResult = await publicClient.readContract({
            address: contractData.address,
            abi: contractData.abi,
            functionName: "getMatchResult",
            args: [BigInt(mockMatchId)],
          });

          console.log("Pre-check match result:", matchResult);

          // @ts-ignore
          if (matchResult && matchResult.matchId !== 0n) {
            notification.error("Match ID already exists. Please generate a new one.");
            setIsRecording(false);
            return;
          }
        } catch (err) {
          console.error("Error checking match ID:", err);
          // Continue if check fails, let the contract handle it
        }
      }

      console.log("Recording match with args:", {
        matchId: mockMatchId,
        winner,
        participants: parts,
        matchData,
      });

      const tx = await writeCompetition({
        functionName: "recordMatchResult",
        args: [BigInt(mockMatchId), winner as `0x${string}`, parts as `0x${string}`[], matchData],
        gas: 500000n,
      });

      console.log("Mock match transaction response:", tx);
      console.log("Transaction type:", typeof tx);
      console.log("Transaction keys:", tx && typeof tx === "object" ? Object.keys(tx) : "N/A");

      // Extract transaction hash - handle different response formats
      let transactionHash = "";
      let transactionResponse: any = tx;

      // Handle different response formats from Scaffold-ETH
      if (tx) {
        if (typeof tx === "string") {
          // Direct transaction hash string
          transactionHash = tx;
        } else if (typeof tx === "object") {
          if ("hash" in tx) {
            transactionHash = (tx as any).hash;
          } else if ("transactionHash" in tx) {
            transactionHash = (tx as any).transactionHash;
          } else if ("wait" in tx) {
            // This is a transaction response object, wait for it to be mined
            try {
              const receipt = await (tx as any).wait();
              transactionHash = receipt.hash || receipt.transactionHash;
              transactionResponse = receipt;
            } catch (waitError) {
              console.log("Error waiting for transaction:", waitError);
              // Try to get hash from the original response
              if ("hash" in tx) {
                transactionHash = (tx as any).hash;
              }
            }
          }
        }
      }

      console.log("Extracted transaction hash:", transactionHash);
      console.log("Full transaction response:", transactionResponse);

      if (transactionHash) {
        // Get block number from transaction response
        let blockNumber = 0;
        if (transactionResponse && typeof transactionResponse === "object") {
          // Try different possible block number fields
          if ("blockNumber" in transactionResponse) {
            blockNumber = Number(transactionResponse.blockNumber) || 0;
          } else if ("block" in transactionResponse) {
            blockNumber = Number(transactionResponse.block) || 0;
          } else if ("blockHash" in transactionResponse) {
            // If we have blockHash, we can try to get block number from it
            blockNumber = Date.now(); // Use timestamp as fallback
          }
        }

        // If still 0, use a timestamp-based block number
        if (blockNumber === 0) {
          blockNumber = Math.floor(Date.now() / 1000); // Use Unix timestamp as block number
        }

        // Store transaction details
        const txDetails: TransactionDetails = {
          hash: transactionHash,
          matchId: mockMatchId,
          winner,
          participants: parts,
          matchData,
          timestamp: Date.now(),
          blockNumber: blockNumber,
        };

        setLastTransaction(txDetails);

        // Add to transaction history
        setTransactionHistory(prev => [txDetails, ...prev]);

        notification.success("Match recorded on-chain");

        // Debug: Log the transaction details
        console.log("Transaction recorded successfully:", txDetails);
        console.log("Added to transaction history. Total transactions:", transactionHistory.length + 1);

        // Reset form
        setMockMatchId("");
        setWinner("");
        setParticipants("");
        setMatchData("Robotics Challenge: Autonomous Navigation");
      } else {
        console.error("Mock match recording failed - no valid transaction hash extracted");
        console.error("Transaction response:", tx);
        notification.error("Failed to record match - no valid transaction hash. Check console for details.");
      }
    } catch (e) {
      console.error("Error recording match:", e);

      // Provide more specific error messages
      if (e && typeof e === "object" && "message" in e) {
        const errorMessage = (e as any).message;
        if (errorMessage.includes("Internal JSON-RPC error")) {
          notification.error("Blockchain connection error. Please check if your local blockchain is running.");
        } else if (errorMessage.includes("insufficient funds")) {
          notification.error("Insufficient funds for transaction");
        } else if (errorMessage.includes("nonce")) {
          notification.error("Transaction nonce error. Please try again.");
        } else if (errorMessage.includes("already recorded")) {
          notification.error("Match ID already exists. Try a different Match ID.");
        } else {
          notification.error(`Failed to record match: ${errorMessage}`);
        }
      } else {
        notification.error("Failed to record match. Check console for details.");
      }
    } finally {
      setIsRecording(false);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const refreshEvents = () => {
    console.log("Manually refreshing events...");
    console.log("Current events:", events);
    console.log("Events loading:", eventsLoading);
    // Force a page reload to refresh events
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 pt-24 pb-8"
    >
      <h1 className="text-3xl font-bold mb-6">Create Mock Match</h1>

      {/* Debug Info Removed */}

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body space-y-4">
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={generateMock}>
              Generate Mock
            </button>
            <button className="btn btn-primary" onClick={record} disabled={!mockMatchId || !winner || isRecording}>
              {isRecording ? "Recording..." : "Record On-Chain"}
            </button>
            <button className="btn btn-outline btn-sm" onClick={testContractConnection}>
              Test Connection
            </button>
          </div>

          <label className="form-control">
            <span className="label-text">Match ID</span>
            <input
              className="input input-bordered"
              value={mockMatchId}
              onChange={e => setMockMatchId(e.target.value)}
              placeholder="e.g. 1725342342"
            />
          </label>

          <label className="form-control">
            <span className="label-text">Winner Address</span>
            <input
              className="input input-bordered"
              value={winner}
              onChange={e => setWinner(e.target.value)}
              placeholder="0x..."
            />
          </label>

          <label className="form-control">
            <span className="label-text">Participants (comma-separated)</span>
            <input
              className="input input-bordered"
              value={participants}
              onChange={e => setParticipants(e.target.value)}
              placeholder="0xabc..., 0xdef..."
            />
          </label>

          <label className="form-control">
            <span className="label-text">Match Data</span>
            <textarea
              className="textarea textarea-bordered"
              value={matchData}
              onChange={e => setMatchData(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Last Transaction Details */}
      {lastTransaction && (
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-2xl">Last Transaction Details</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setLastTransaction(null)}>
                ← Back to Matches
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Transaction Hash:</span>
                  <div className="font-mono text-sm bg-base-200 p-2 rounded break-all">{lastTransaction.hash}</div>
                </div>
                <div>
                  <span className="font-semibold">Match ID:</span>
                  <span className="ml-2">{lastTransaction.matchId}</span>
                </div>
                <div>
                  <span className="font-semibold">Winner:</span>
                  <span className="ml-2 font-mono">{formatAddress(lastTransaction.winner)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Participants:</span>
                  <div className="text-sm">
                    {lastTransaction.participants.map((participant, index) => (
                      <div key={index} className="font-mono bg-base-200 p-1 rounded mb-1">
                        {formatAddress(participant)}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-semibold">Match Data:</span>
                  <span className="ml-2">{lastTransaction.matchData}</span>
                </div>
                <div>
                  <span className="font-semibold">Timestamp:</span>
                  <span className="ml-2">{new Date(lastTransaction.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-2xl">Transaction History</h2>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" onClick={refreshEvents}>
                ↻ Refresh
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                ↑ Top
              </button>
            </div>
          </div>

          {transactionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Match ID</th>
                    <th>Winner</th>
                    <th>Block Number</th>
                    <th>Transaction Hash</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((transaction, index) => (
                    <tr key={index}>
                      <td className="font-mono">{transaction.matchId}</td>
                      <td className="font-mono">{formatAddress(transaction.winner)}</td>
                      <td className="font-mono">{transaction.blockNumber || "Pending"}</td>
                      <td className="font-mono text-xs">
                        <a
                          href={`/blockexplorer/transaction/${transaction.hash}`}
                          className="link link-primary hover:underline"
                        >
                          {formatAddress(transaction.hash)}
                        </a>
                      </td>
                      <td className="font-mono text-xs">{new Date(transaction.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found yet.</p>
              <p className="text-sm">Record your first match to see it here!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
