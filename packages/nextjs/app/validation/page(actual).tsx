// "use client";

// import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
// import { useState } from "react";
// import { Address } from "~~/components/scaffold-eth";

// const CompetitionsPage = () => {
//   const [matchId, setMatchId] = useState("");
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [verificationResult, setVerificationResult] = useState<any>(null);

//   const { data: matchResult, refetch: refetchMatchResult } = useScaffoldReadContract({
//     contractName: "RoboticsCompetition",
//     functionName: "getMatchResult",
//     args: [matchId ? BigInt(matchId) : BigInt(0)],
//   });

//   const handleVerification = async () => {
//     if (!matchId) {
//       alert("Please enter a Match ID");
//       return;
//     }

//     setIsVerifying(true);
//     try {
//       // Refetch the latest data from blockchain
//       await refetchMatchResult();
//       setVerificationResult(matchResult);
//     } catch (error) {
//       console.error("Verification failed:", error);
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   const getArbiscanUrl = (address: string) => {
//     return `https://sepolia.arbiscan.io/address/${address}`;
//   };

//   const getTransactionUrl = (txHash: string) => {
//     return `https://sepolia.arbiscan.io/tx/${txHash}`;
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-4xl font-bold text-center mb-8">🏆 Competition Results Verification</h1>

//       <div className="max-w-4xl mx-auto">
//         <div className="card bg-base-100 shadow-xl">
//           <div className="card-body">
//             <div className="form-control">
//               <label className="label">
//                 <span className="label-text text-lg font-semibold">Enter Match ID to verify:</span>
//               </label>
//               <div className="flex gap-4">
//                 <input
//                   type="number"
//                   placeholder="Enter Match ID (e.g., 1, 2, 3...)"
//                   className="input input-bordered flex-1"
//                   value={matchId}
//                   onChange={(e) => setMatchId(e.target.value)}
//                 />
//                 <button
//                   className={`btn btn-primary ${isVerifying ? 'loading' : ''}`}
//                   onClick={handleVerification}
//                   disabled={!matchId || isVerifying}
//                 >
//                   {isVerifying ? 'Verifying...' : '🔍 Verify Match'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Verification Results */}
//         {verificationResult && verificationResult.verified && (
//           <div className="card bg-base-100 shadow-xl mt-6">
//             <div className="card-body">
//               <h2 className="card-title text-2xl">✅ Match #{matchId} Verified</h2>

//               <div className="grid md:grid-cols-2 gap-6 mt-4">
//                 {/* Match Details */}
//                 <div className="space-y-3">
//                   <h3 className="text-lg font-semibold text-primary">Match Information</h3>
//                   <div className="space-y-2">
//                     <p><strong>Status:</strong> <span className="badge badge-success">Verified</span></p>
//                     <p><strong>Timestamp:</strong> {new Date(Number(verificationResult.timestamp) * 1000).toLocaleString()}</p>
//                     <p><strong>Match Data:</strong> {verificationResult.matchData}</p>
//                   </div>
//                 </div>

//                 {/* Winner Information */}
//                 <div className="space-y-3">
//                   <h3 className="text-lg font-semibold text-success">🏆 Winner</h3>
//                   <div className="space-y-2">
//                     <p><strong>Address:</strong></p>
//                     <Address address={verificationResult.winner} />
//                     <a
//                       href={getArbiscanUrl(verificationResult.winner)}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="btn btn-outline btn-sm btn-success"
//                     >
//                       🔗 View on Arbiscan
//                     </a>
//                   </div>
//                 </div>
//               </div>

//               {/* Participants List */}
//               <div className="mt-6">
//                 <h3 className="text-lg font-semibold text-info mb-3">👥 Participants</h3>
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
//                   {verificationResult.participants.map((participant: string, index: number) => (
//                     <div key={index} className="card bg-base-200 p-3">
//                       <div className="flex items-center justify-between">
//                         <Address address={participant} />
//                         {participant === verificationResult.winner && (
//                           <span className="badge badge-success badge-sm">Winner</span>
//                         )}
//                       </div>
//                       <a
//                         href={getArbiscanUrl(participant)}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="btn btn-outline btn-xs mt-2"
//                       >
//                         🔗 Arbiscan
//                       </a>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Blockchain Verification Links */}
//               <div className="mt-6 p-4 bg-base-200 rounded-lg">
//                 <h3 className="text-lg font-semibold text-accent mb-3">🔗 Blockchain Verification</h3>
//                 <div className="grid md:grid-cols-2 gap-4">
//                   <div>
//                     <h4 className="font-semibold mb-2">Contract Address</h4>
//                     <p className="text-sm mb-2">RoboticsCompetition Contract:</p>
//                     <Address address="0x5FbDB2315678afecb367f032d93F642f64180aa3" />
//                     <a
//                       href="https://sepolia.arbiscan.io/address/0x5FbDB2315678afecb367f032d93F642f64180aa3"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="btn btn-outline btn-sm mt-2"
//                     >
//                       🔗 View Contract on Arbiscan
//                     </a>
//                   </div>
//                   <div>
//                     <h4 className="font-semibold mb-2">Network Information</h4>
//                     <p className="text-sm mb-2">Arbitrum Sepolia Testnet</p>
//                     <p className="text-sm mb-2">Chain ID: 421614</p>
//                     <a
//                       href="https://sepolia.arbiscan.io/"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="btn btn-outline btn-sm"
//                     >
//                       🌐 Open Arbiscan
//                     </a>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* No Match Found */}
//         {verificationResult && !verificationResult.verified && matchId && (
//           <div className="alert alert-warning mt-6">
//             <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//             </svg>
//             <div>
//               <h3 className="font-bold">Match Not Found</h3>
//               <div className="text-xs">Match ID {matchId} was not found or is not verified on the blockchain.</div>
//             </div>
//           </div>
//         )}

//         {/* Instructions */}
//         <div className="mt-8 p-6 bg-base-200 rounded-lg">
//           <h3 className="text-xl font-semibold mb-4">📋 How to Verify Competition Results</h3>
//           <ol className="list-decimal list-inside space-y-2 text-sm">
//             <li><strong>Enter Match ID:</strong> Input the Match ID you want to verify</li>
//             <li><strong>Click Verify:</strong> Press the "Verify Match" button to check blockchain data</li>
//             <li><strong>View Results:</strong> See verified match information and participant details</li>
//             <li><strong>Blockchain Verification:</strong> Use Arbiscan links to verify data on-chain</li>
//             <li><strong>Contract Interaction:</strong> View the smart contract that stores this data</li>
//           </ol>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CompetitionsPage;
