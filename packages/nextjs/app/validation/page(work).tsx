"use client";

// import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useState } from "react";
import { Address } from "~~/components/scaffold-eth";

const CompetitionsPage = () => {
  const [transactionAddress, setTransactionAddress] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // For testing, we'll use a mock match result since we're not using matchId anymore
  const mockMatchResult = {
    verified: true,
    winner: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    participants: [
      "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "0x1234567890123456789012345678901234567890",
      "0xabcdef1234567890abcdef1234567890abcdef12",
    ],
    timestamp: Math.floor(Date.now() / 1000),
    matchData: "Robotics Competition Match - Autonomous Navigation Challenge",
  };

  const handleVerification = async () => {
    if (!transactionAddress) {
      alert("Please enter a Transaction Address");
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For testing, we'll use the mock result
      setVerificationResult(mockMatchResult);
    } catch (error) {
      console.error("Verification failed:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getArbiscanUrl = (address: string) => {
    return `https://sepolia.arbiscan.io/address/${address}`;
  };

  const getTransactionUrl = (txHash: string) => {
    return `https://sepolia.arbiscan.io/tx/${txHash}`;
  };

  const isValidTransactionAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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
                  {isVerifying ? "Verifying..." : "�� Verify Transaction"}
                </button>
              </div>
              {transactionAddress && !isValidTransactionAddress(transactionAddress) && (
                <label className="label">
                  <span className="label-text-alt text-error">Invalid transaction address format</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Information */}
        {transactionAddress && isValidTransactionAddress(transactionAddress) && (
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
                    href={getTransactionUrl(transactionAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    🔗 View on Arbiscan
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Results */}
        {verificationResult && verificationResult.verified && (
          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h2 className="card-title text-2xl">✅ Competition Results Verified</h2>

              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Match Details */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary">Competition Information</h3>
                  <div className="space-y-2">
                    <p>
                      <strong>Status:</strong> <span className="badge badge-success">Verified</span>
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
                    <a
                      href={getArbiscanUrl(verificationResult.winner)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm btn-success"
                    >
                      🔗 View on Arbiscan
                    </a>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-info mb-3">�� Participants</h3>
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

              {/* Blockchain Verification Links */}
              <div className="mt-6 p-4 bg-base-200 rounded-lg">
                <h3 className="text-lg font-semibold text-accent mb-3">🔗 Blockchain Verification</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Contract Address</h4>
                    <p className="text-sm mb-2">RoboticsCompetition Contract:</p>
                    <Address address="0x5FbDB2315678afecb367f032d93F642f64180aa3" />
                    <a
                      href="https://sepolia.arbiscan.io/address/0x5FbDB2315678afecb367f032d93F642f64180aa3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm mt-2"
                    >
                      🔗 View Contract on Arbiscan
                    </a>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Network Information</h4>
                    <p className="text-sm mb-2">Arbitrum Sepolia Testnet</p>
                    <p className="text-sm mb-2">Chain ID: 421614</p>
                    <a
                      href="https://sepolia.arbiscan.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      🌐 Open Arbiscan
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
              <strong>Enter Transaction Address:</strong> Input any valid Ethereum transaction hash (0x...)
            </li>
            <li>
              <strong>Click Verify:</strong> Press the Verify Transaction button to simulate verification
            </li>
            <li>
              <strong>View Results:</strong> See sample competition information and participant details
            </li>
            <li>
              <strong>Blockchain Verification:</strong> Use Arbiscan links to explore the blockchain
            </li>
            <li>
              <strong>Contract Interaction:</strong> View the smart contract that stores competition data
            </li>
          </ol>

          <div className="mt-4 p-3 bg-base-300 rounded">
            <p className="text-sm font-semibold">�� Testing Mode:</p>
            <p className="text-sm">
              This is a demonstration version. Enter any valid transaction hash (0x followed by 40 hex characters) to
              see sample competition results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionsPage;
