import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployRoboticsContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy Robotics Competition contract
  const roboticsCompetition = await deploy("RoboticsCompetition", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Deploy NFT Marketplace contract (note: contract name is "Marketplace" not "NFTMarketplace")
  const marketplace = await deploy("Marketplace", {
    from: deployer,
    args: [5], // 5% fee percentage
    log: true,
    autoMine: true,
  });

  // Deploy NFT contract
  const nft = await deploy("NFT", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("🏆 Robotics Competition deployed to:", roboticsCompetition.address);
  console.log("🛒 NFT Marketplace deployed to:", marketplace.address);
  console.log("🎫 NFT deployed to:", nft.address);
};

export default deployRoboticsContracts;
deployRoboticsContracts.tags = ["RoboticsContracts"];
