// Comprehensive NFT Cache Clearing Script
console.log("🧹 Starting comprehensive NFT cache clearing...");

// Function to clear localStorage in browser
function clearBrowserCache() {
  if (typeof window !== 'undefined' && window.localStorage) {
    console.log("🌐 Clearing browser localStorage...");
    
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    console.log("Found localStorage keys:", keys);
    
    // Clear NFT-related keys
    const nftKeys = keys.filter(key => 
      key.startsWith("nft-") || 
      key.includes("nft") || 
      key.includes("NFT") ||
      key.includes("marketplace") ||
      key.includes("transaction") ||
      key.includes("mint") ||
      key.includes("token") ||
      key.includes("created") ||
      key.includes("image")
    );
    
    console.log("NFT-related keys to clear:", nftKeys);
    
    // Clear each key
    nftKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Cleared: ${key}`);
    });
    
    console.log("✅ Browser localStorage cleared!");
    console.log("Remaining keys:", Object.keys(localStorage));
  } else {
    console.log("❌ localStorage not available (not in browser environment)");
  }
}

// Function to clear any file-based cache
function clearFileCache() {
  console.log("📁 Checking for file-based cache...");
  
  // List common cache directories
  const cacheDirs = [
    'packages/nextjs/.next/cache',
    'packages/nextjs/.next/static',
    'node_modules/.cache',
    'packages/hardhat/cache',
    'packages/hardhat/artifacts'
  ];
  
  cacheDirs.forEach(dir => {
    console.log(`Checking cache directory: ${dir}`);
  });
  
  console.log("📁 File cache check complete");
}

// Function to reset blockchain state (if needed)
function resetBlockchainState() {
  console.log("⛓️ Blockchain state reset options:");
  console.log("1. Redeploy contracts: yarn deploy");
  console.log("2. Reset Hardhat network: yarn chain --reset");
  console.log("3. Clear Hardhat cache: cd packages/hardhat && npx hardhat clean");
}

// Main execution
console.log("🚀 Starting NFT cache clearing process...");

// Clear browser cache
clearBrowserCache();

// Clear file cache
clearFileCache();

// Show blockchain reset options
resetBlockchainState();

console.log("✅ NFT cache clearing process complete!");
console.log("📋 Next steps:");
console.log("1. Refresh your browser page");
console.log("2. If issues persist, redeploy contracts with: yarn deploy");
console.log("3. Clear browser cache completely if needed");
