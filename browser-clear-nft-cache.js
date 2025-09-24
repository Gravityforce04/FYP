// Browser Console Script - Copy and paste this into your browser console
console.log("🧹 Clearing NFT cache from browser console...");

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
  key.includes("image") ||
  key.includes("metadata")
);

console.log("NFT-related keys to clear:", nftKeys);

// Clear each key
nftKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Cleared: ${key}`);
});

// Also clear any state that might be cached in memory
if (typeof window !== 'undefined') {
  // Clear any cached data in window object
  if (window.nftCache) {
    delete window.nftCache;
    console.log("✅ Cleared window.nftCache");
  }
  
  // Clear any cached data in global variables
  if (window.createdNFTs) {
    window.createdNFTs = [];
    console.log("✅ Cleared window.createdNFTs");
  }
  
  if (window.ownedNFTs) {
    window.ownedNFTs = [];
    console.log("✅ Cleared window.ownedNFTs");
  }
}

console.log("✅ NFT cache clearing complete!");
console.log("Remaining localStorage keys:", Object.keys(localStorage));
console.log("🔄 Please refresh the page to see the changes");
