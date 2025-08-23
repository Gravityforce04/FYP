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

  // Deploy NFT Marketplace contract
  const nftMarketplace = await deploy("NFTMarketplace", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("🏆 Robotics Competition deployed to:", roboticsCompetition.address);
  console.log("🛒 NFT Marketplace deployed to:", nftMarketplace.address);
};

export default deployRoboticsContracts;
deployRoboticsContracts.tags = ["RoboticsContracts"];
