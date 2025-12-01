import pkg from "hardhat";
const hre = pkg;

async function main() {
  const [admin, buyer, seller] = await hre.ethers.getSigners();

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
   seller.address,
   admin.address
);


  await escrow.waitForDeployment();

  console.log("Escrow deployed to:", escrow.target);
  console.log("Admin:", admin.address);
  console.log("Buyer:", buyer.address);
  console.log("Seller:", seller.address);
}

await main();
