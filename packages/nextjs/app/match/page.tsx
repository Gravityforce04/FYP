"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function MatchPage() {
  const { address } = useAccount();
  const [mockMatchId, setMockMatchId] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [participants, setParticipants] = useState<string>("");
  const [matchData, setMatchData] = useState<string>("Robotics Challenge: Autonomous Navigation");

  const { writeContractAsync: writeCompetition } = useScaffoldWriteContract({
    contractName: "RoboticsCompetition",
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
    try {
      const parts = participants
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      await writeCompetition({
        functionName: "recordMatchResult",
        args: [BigInt(mockMatchId), winner as `0x${string}`, parts as `0x${string}`[], matchData],
      });
      notification.success("Match recorded on-chain");
    } catch (e) {
      console.error(e);
      notification.error("Failed to record match");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Mock Match</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={generateMock}>
              Generate Mock
            </button>
            <button className="btn btn-primary" onClick={record} disabled={!mockMatchId || !winner}>
              Record On-Chain
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
    </div>
  );
}
