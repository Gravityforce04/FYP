// import { expect } from "chai";
// import { ethers } from "hardhat";

// describe("Marketplace", function () {
//   it("deploys NFT and Marketplace, lists and purchases an item", async function () {
//     const [seller, buyer] = await ethers.getSigners();

//     // Deploy NFT
//     const NftFactory = await ethers.getContractFactory("NFT", seller);
//     const nft = await NftFactory.deploy();
//     await nft.waitForDeployment();

//     // Deploy Marketplace (feePercent = 1)
//     const MarketFactory = await ethers.getContractFactory("Marketplace", seller);
//     const market = await MarketFactory.deploy(1);
//     await market.waitForDeployment();

//     // Mint an NFT
//     const mintTx = await nft.connect(seller).mint("ipfs://token-1");
//     await mintTx.wait();
//     const tokenId = await nft.tokenCount();

//     // Approve marketplace and list item
//     await (await nft.connect(seller).setApprovalForAll(await market.getAddress(), true)).wait();
//     const price = ethers.parseEther("1");
//     await (await market.connect(seller).makeItem(await nft.getAddress(), tokenId, price)).wait();

//     // Check item storage
//     const item = await market.items(1);
//     expect(item.itemId).to.equal(1n);
//     expect(item.nft).to.equal(await nft.getAddress());
//     expect(item.tokenId).to.equal(tokenId);
//     expect(item.price).to.equal(price);
//     expect(item.seller).to.equal(await seller.getAddress());
//     expect(item.sold).to.equal(false);

//     // Compute total price and purchase by buyer
//     const totalPrice = await market.getTotalPrice(1);
//     await (await market.connect(buyer).purchaseItem(1, { value: totalPrice })).wait();

//     const updated = await market.items(1);
//     expect(updated.sold).to.equal(true);
//     expect(await nft.ownerOf(tokenId)).to.equal(await buyer.getAddress());
//   });
// });
