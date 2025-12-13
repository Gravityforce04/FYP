import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import scaffoldConfig from "~~/scaffold.config";

const targetNetwork = scaffoldConfig.targetNetworks[0];
const rpcUrl = scaffoldConfig.rpcOverrides?.[targetNetwork.id] || targetNetwork.rpcUrls.default.http[0];

// Create a public client for reading from the blockchain
const publicClient = createPublicClient({
  chain: targetNetwork,
  transport: http(rpcUrl),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const itemId = resolvedParams.id;

    // Read from deployed contracts
    const deployedContracts = await import("../../../../../contracts/deployedContracts");
    // @ts-ignore
    const contracts = deployedContracts.default[targetNetwork.id];

    if (!contracts || !contracts.Marketplace?.address || !contracts.NFT?.address) {
      console.error(`Contracts not found for chain ID ${targetNetwork.id}`);
      return NextResponse.json(
        { error: `Contracts not deployed on chain ${targetNetwork.id} (${targetNetwork.name})` },
        { status: 500 },
      );
    }

    // Get item from marketplace contract
    const item = (await publicClient.readContract({
      address: contracts.Marketplace.address as `0x${string}`,
      abi: contracts.Marketplace.abi,
      functionName: "items",
      args: [BigInt(itemId)],
    })) as any;

    console.log(`API: Item ${itemId} from contract:`, item);

    if (!item || item.sold) {
      console.log(`API: Item ${itemId} not found or already sold`);
      return NextResponse.json({ error: "Item not found or already sold" }, { status: 404 });
    }

    // Get tokenURI from NFT contract
    console.log(`API: Getting tokenURI for tokenId:`, item.tokenId);
    const tokenURI = await publicClient.readContract({
      address: contracts.NFT.address as `0x${string}`,
      abi: contracts.NFT.abi,
      functionName: "tokenURI",
      args: [item.tokenId],
    });
    console.log(`API: TokenURI result:`, tokenURI);

    const marketplaceItem = {
      itemId: parseInt(itemId),
      nft: item.nft,
      tokenId: Number(item.tokenId),
      price: item.price.toString(),
      seller: item.seller,
      sold: item.sold,
      listed: true,
      tokenURI: tokenURI,
      totalPrice: ((item.price * BigInt(105)) / BigInt(100)).toString(), // Price + 5% fee
    };

    return NextResponse.json(marketplaceItem);
  } catch (error) {
    console.error("Error fetching marketplace item:", error);
    return NextResponse.json({ error: "Failed to fetch marketplace item" }, { status: 500 });
  }
}
