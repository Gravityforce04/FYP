const { createPublicClient, http, parseAbiItem } = require('viem');
const { arbitrumSepolia } = require('viem/chains');

async function checkMatch() {
    const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http("https://sepolia-rollup.arbitrum.io/rpc")
    });

    const contractAddress = "0xe760AEf9b270Ae57C3efB684110bb854b56FF9E0";
    const matchId = 1765386560n;

    const abi = [
        {
            inputs: [{ name: "_matchId", type: "uint256" }],
            name: "getMatchResult",
            outputs: [
                {
                    components: [
                        { name: "matchId", type: "uint256" },
                        { name: "winner", type: "address" },
                        { name: "participants", type: "address[]" },
                        { name: "timestamp", type: "uint256" },
                        { name: "matchData", type: "string" },
                        { name: "verified", type: "bool" }
                    ],
                    name: "",
                    type: "tuple"
                }
            ],
            stateMutability: "view",
            type: "function"
        }
    ];

    try {
        console.log(`Checking match ${matchId} on ${contractAddress}...`);
        const result = await client.readContract({
            address: contractAddress,
            abi: abi,
            functionName: "getMatchResult",
            args: [matchId]
        });

        console.log("Match Result:", result);
        if (result.matchId === 0n) {
            console.log("Match NOT found (ID is 0).");
        } else {
            console.log("Match FOUND.");
        }
    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

checkMatch();
