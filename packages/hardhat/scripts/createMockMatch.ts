import { ethers } from "hardhat";

async function main() {
  console.log("🏆 Creating mock match for testing...");

  // Get the deployed RoboticsCompetition contract dynamically
  const RoboticsCompetition = await ethers.getContractFactory("RoboticsCompetition");

  // Try to get the deployed contract address from deployments
  let roboticsCompetition: any;
  try {
    // This will work if the contract is already deployed
    const deployment = await import("../deployments/localhost/RoboticsCompetition.json" as any);
    roboticsCompetition = RoboticsCompetition.attach(deployment.address);
    console.log("📍 Using deployed contract at:", deployment.address);
  } catch {
    console.log("⚠️ No deployed contract found. Please run 'yarn deploy' first.");
    process.exit(1);
  }

  // Get signers
  const [, user1, user2] = await ethers.getSigners();

  // Create a mock match
  const matchId = 1;
  const winner = user1.address;
  const participants = [user1.address, user2.address];
  const matchData = "Mock Robotics Competition Match #1";

  try {
    console.log(`Creating match with ID: ${matchId}`);
    console.log(`Winner: ${winner}`);
    console.log(`Participants: ${participants.join(", ")}`);

    const tx = await roboticsCompetition.recordMatchResult(matchId, winner, participants, matchData);

    await tx.wait();

    console.log("✅ Mock match created successfully!");
    console.log(`Match ID: ${matchId}`);
    console.log(`Winner: ${winner}`);
    console.log(`Participants: ${participants.join(", ")}`);
    console.log(`Transaction Hash: ${tx.hash}`);

    // Verify the match was created
    const matchResult = await roboticsCompetition.getMatchResult(matchId);
    console.log("Match verification status:", matchResult.verified);
  } catch (error) {
    console.error("❌ Failed to create mock match:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
