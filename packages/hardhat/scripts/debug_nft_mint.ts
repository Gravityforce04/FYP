import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x7782A464603247638C94A4376398Ce09AF5354D7"; // NFT on Arb Sepolia
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

  const contract = await ethers.getContractAt("NFT", contractAddress);
  const contractWithProvider = contract.connect(provider);

  try {
    console.log("Checking name and symbol...");
    const name = await contractWithProvider.name();
    const symbol = await contractWithProvider.symbol();
    console.log(`Contract: ${name} (${symbol})`);
  } catch (e) {
    console.error("Error fetching name/symbol:", e);
  }

  // Try to estimate gas for minting
  try {
    console.log("Estimating gas for mint...");
    const tokenURI = "ipfs://QmTestHash1234567890"; // Dummy IPFS URI

    console.log("Simulating call...");
    await contractWithProvider.mint.staticCall(tokenURI);
    console.log("Simulation successful!");

    console.log("Estimating gas...");
    const gas = await contractWithProvider.mint.estimateGas(tokenURI);
    console.log("Estimated Gas:", gas.toString());
  } catch (e) {
    console.error("Gas estimation/Simulation failed:", e);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
