# 🤖 Robotics eSports Platform

A decentralized platform for autonomous robot competitions, NFT trading, and on-chain result verification. Built on Ethereum (Arbitrum Sepolia).

## 🌟 Features

- **Create & Mint**: Design and mint unique autonomous robot NFTs with specific attributes and metadata.
- **Marketplace**: Buy, sell, and trade high-performance robots and rare parts in a decentralized marketplace.
- **Competition & Match**: Record match results on-chain to create an immutable history of performance.
- **Validation**: Verify the integrity of match results and winner status using transaction hashes and on-chain data.
- **Interactive UI**: Premium user interface with live updates, educational components, and seamless wallet integration.

## 🚀 Deployment Information (Arbitrum Sepolia)

The smart contracts are deployed on the Arbitrum Sepolia Testnet:

| Contract Name | Address |
|---|---|
| **RoboticsCompetition** | `0xe760AEf9b270Ae57C3efB684110bb854b56FF9E0` |
| **Marketplace** | `0x4caAd228483AECe7eEdf0e51A13b27cfE2783e46` |
| **NFT** | `0x7782A464603247638C94A4376398Ce09AF5354D7` |

## 🛠 Tech Stack

- **Frontend**: NextJS, TailwindCSS, DaisyUI, Framer Motion
- **Blockchain**: Hardhat, Wagmi, Viem
- **Language**: TypeScript, Solidity

## 🏁 Getting Started

1. **Install Dependencies**
   ```bash
   yarn install
   ```

2. **Run Local Network (Optional for testing)**
   ```bash
   yarn chain
   ```

3. **Deploy Contracts (Local)**
   ```bash
   yarn deploy
   ```

4. **Start Frontend**
   ```bash
   yarn start
   ```

Visit your app on: `http://localhost:3000`

## 📚 Documentation

- **Validation**: Check the `/validation` page to learn how to verify match results.
- **Create**: Use the `/create` page to mint your first robot.
- **Marketplace**: Explore `/marketplace` to trade assets.