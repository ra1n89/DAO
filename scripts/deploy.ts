
import { ethers } from "hardhat";

async function main() {

  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.deployed();
  const DAO = await ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(token.address);
  await dao.deployed();

  console.log("Token deployed to:", token.address);
  console.log("DAO deployed to:", dao.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
