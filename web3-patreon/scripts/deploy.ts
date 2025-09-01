import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CreatorSupport contract...");

  const CreatorSupport = await ethers.getContractFactory("CreatorSupport");
  const creatorSupport = await CreatorSupport.deploy();

  await creatorSupport.deployed();

  console.log("CreatorSupport deployed to:", creatorSupport.address);

  // Add supported tokens (Polygon mainnet addresses)
  const usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC on Polygon
  const daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"; // DAI on Polygon
  const usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon

  console.log("Adding supported tokens...");
  
  await creatorSupport.addSupportedToken(usdcAddress);
  console.log("Added USDC support");
  
  await creatorSupport.addSupportedToken(daiAddress);
  console.log("Added DAI support");
  
  await creatorSupport.addSupportedToken(usdtAddress);
  console.log("Added USDT support");

  console.log("Deployment completed!");
  console.log("Contract address:", creatorSupport.address);
  console.log("Supported tokens:", await creatorSupport.getSupportedTokens());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });