import { ethers } from "hardhat";

async function main() {
    const contractAddress = "0xD08A6C445c0eB6bb1fC83D192B12e15Eab65B727"; // RoboticsCompetition on Arb Sepolia
    const rpcUrl = "https://sepolia-rollup.arbitrum.io/rpc";

    console.log("Connecting to provider:", rpcUrl);
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    console.log("Checking code at address:", contractAddress);
    const code = await provider.getCode(contractAddress);

    if (code === "0x") {
        console.error("ERROR: No code found at contract address!");
        return;
    }
    console.log("Code found, length:", code.length);

    const contract = await ethers.getContractAt("RoboticsCompetition", contractAddress);
    const contractWithProvider = contract.connect(provider);

    try {
        console.log("Checking owner...");
        const owner = await contractWithProvider.owner();
        console.log("Contract Owner:", owner);
    } catch (e) {
        console.error("Error fetching owner:", e);
    }

    const matchId = 1765391436;
    try {
        console.log(`Checking match ID ${matchId}...`);
        const result = await contractWithProvider.getMatchResult(matchId);
        console.log("Match Result:", result);
        if (result.matchId.toString() !== "0") {
            console.log("Match ID ALREADY EXISTS!");
        } else {
            console.log("Match ID is available (returned 0).");
        }
    } catch (e) {
        console.error("Error fetching match result:", e);
    }

    // Try to estimate gas for recording the match
    try {
        console.log("Estimating gas for recordMatchResult...");
        const winner = "0xb42BCe219DFAE478141D32EDac2459EEBa374941";
        const participants = ["0xb42BCe219DFAE478141D32EDac2459EEBa374941"];
        const matchData = "Robotics Challenge: Autonomous Navigation";

        // We need a signer to estimate gas properly if it depends on msg.sender,
        // but for this function it shouldn't matter much unless there are specific checks.
        // However, we can't sign without a private key.
        // We can use callStatic to simulate the call.

        console.log("Simulating call...");
        await contractWithProvider.recordMatchResult.staticCall(matchId, winner, participants, matchData);
        console.log("Simulation successful!");

        console.log("Estimating gas...");
        const gas = await contractWithProvider.recordMatchResult.estimateGas(matchId, winner, participants, matchData);
        console.log("Estimated Gas:", gas.toString());
    } catch (e) {
        console.error("Gas estimation/Simulation failed:", e);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
