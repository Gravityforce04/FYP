"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
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
  const [mockMatchId, setMockMatchId] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [participants, setParticipants] = useState<string>("");
  const [matchData, setMatchData] = useState<string>("Robotics Challenge: Autonomous Navigation");
  const [lastTransaction, setLastTransaction] = useState<TransactionDetails | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const { writeContractAsync: writeCompetition } = useScaffoldWriteContract({
    contractName: "RoboticsCompetition",
  });

  // Get event history for MatchResultRecorded events
  const { data: events, isLoading: eventsLoading } = useScaffoldEventHistory({
    contractName: "RoboticsCompetition",
    eventName: "MatchResultRecorded",
    watch: true,
  });

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

    setIsRecording(true);
    try {
      const parts = participants
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const tx = await writeCompetition({
        functionName: "recordMatchResult",
        args: [BigInt(mockMatchId), winner as `0x${string}`, parts as `0x${string}`[], matchData],
      });

      if (tx && typeof tx === "object" && "hash" in tx) {
        // Store transaction details
        const txDetails: TransactionDetails = {
          hash: (tx as any).hash,
          matchId: mockMatchId,
          winner,
          participants: parts,
          matchData,
          timestamp: Date.now(),
          blockNumber: 0, // Will be updated when transaction is mined
        };

        setLastTransaction(txDetails);
        notification.success("Match recorded on-chain");

        // Reset form
        setMockMatchId("");
        setWinner("");
        setParticipants("");
        setMatchData("Robotics Challenge: Autonomous Navigation");
      } else {
        notification.error("Transaction failed - no hash returned");
      }
    } catch (e) {
      console.error(e);
      notification.error("Failed to record match");
    } finally {
      setIsRecording(false);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Mock Match</h1>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body space-y-4">
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={generateMock}>
              Generate Mock
            </button>
            <button className="btn btn-primary" onClick={record} disabled={!mockMatchId || !winner || isRecording}>
              {isRecording ? "Recording..." : "Record On-Chain"}
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
              <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
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

          {eventsLoading ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4">Loading transaction history...</p>
            </div>
          ) : events && events.length > 0 ? (
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
                  {events.map((event, index) => (
                    <tr key={index}>
                      <td className="font-mono">{event.args.matchId?.toString()}</td>
                      <td className="font-mono">{formatAddress(event.args.winner || "")}</td>
                      <td className="font-mono">{event.blockNumber}</td>
                      <td className="font-mono text-xs">
                        <a
                          href={`/blockexplorer/transaction/${event.transactionHash}`}
                          className="link link-primary hover:underline"
                        >
                          {formatAddress(event.transactionHash)}
                        </a>
                      </td>
                      <td className="font-mono text-xs">{new Date().toLocaleString()}</td>
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
    </div>
  );
}
