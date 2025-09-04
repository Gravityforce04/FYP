import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const itemId = resolvedParams.id;

    // For now, return a more realistic mock response
    // In a real implementation, you would query the blockchain directly
    const mockItem = {
      itemId: parseInt(itemId),
      nft: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Mock NFT contract address
      tokenId: parseInt(itemId),
      price: "1000000000000000000", // 1 ETH in wei
      seller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Mock seller address
      sold: false,
      listed: true,
      tokenURI: "https://ipfs.io/ipfs/QmMockTokenURI",
      totalPrice: "1050000000000000000", // Price + 5% fee
    };

    return NextResponse.json(mockItem);
  } catch (error) {
    console.error("Error fetching marketplace item:", error);
    return NextResponse.json({ error: "Failed to fetch marketplace item" }, { status: 500 });
  }
}
