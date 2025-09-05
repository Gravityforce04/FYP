// Clear all NFT-related localStorage data
console.log("🧹 Clearing all NFT data from localStorage...");

// Get all localStorage keys
const keys = Object.keys(localStorage);
console.log("Found keys:", keys);

// Clear NFT-related keys
const nftKeys = keys.filter(key => 
  key.startsWith("nft-") || 
  key.includes("nft") || 
  key.includes("NFT") ||
  key.includes("marketplace") ||
  key.includes("transaction")
);

console.log("NFT-related keys to clear:", nftKeys);

// Clear each key
nftKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Cleared: ${key}`);
});

// Clear all keys (nuclear option)
// localStorage.clear();
// console.log("🧹 Cleared ALL localStorage data");

console.log("✅ NFT data clearing complete!");
console.log("Remaining keys:", Object.keys(localStorage));
