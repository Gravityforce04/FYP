"use client";

import { useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const CompetitionsPage = () => {
  const [matchId, setMatchId] = useState("");

  const { data: matchResult } = useScaffoldReadContract({
    contractName: "RoboticsCompetition",
    functionName: "getMatchResult",
    args: [matchId ? BigInt(matchId) : BigInt(0)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">🏆 Competition Results</h1>

      <div className="max-w-2xl mx-auto">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Enter Match ID to verify:</span>
          </label>
          <input
            type="number"
            placeholder="Match ID"
            className="input input-bordered w-full"
            value={matchId}
            onChange={e => setMatchId(e.target.value)}
          />
        </div>

        {matchResult && matchResult.verified && (
          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h2 className="card-title">Match #{matchId}</h2>
              <p>
                <strong>Winner:</strong> {matchResult.winner}
              </p>
              <p>
                <strong>Timestamp:</strong> {new Date(Number(matchResult.timestamp) * 1000).toLocaleString()}
              </p>
              <p>
                <strong>Verified:</strong> ✅ Yes
              </p>
              <p>
                <strong>Match Data:</strong> {matchResult.matchData}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionsPage;
