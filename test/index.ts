import { DataOptions } from "@ethersproject/bytes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deflateSync } from "zlib";
import { DAO, DAO__factory, FirstProposal, FirstProposal__factory, Token, Token__factory } from "../typechain";

describe("DAO", function () {
  let bob: SignerWithAddress,
    alice: SignerWithAddress;
  let token: Token;
  let dao: DAO;
  let firstProposal: FirstProposal;

  before(async () => {
    [bob, alice] = await ethers.getSigners();
  })

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token") as Token__factory;
    const DAO = await ethers.getContractFactory("DAO") as DAO__factory;
    const FirstProposal = await ethers.getContractFactory("FirstProposal") as FirstProposal__factory;
    const _minimumQuorum = 100;
    const _periodDuration = 10 * 24 * 60 * 60;
    token = await Token.deploy() as Token;
    await token.deployed();
    dao = await DAO.deploy(token.address) as DAO;
    await dao.deployed();
    firstProposal = await FirstProposal.deploy() as FirstProposal;
    await firstProposal.deployed();
  })

  it("Checking  owner balance of tokens", async function () {
    const bobBalance = ethers.utils.parseEther("1000");
    expect(await token.balanceOf(bob.address)).to.be.equal(bobBalance)
  });


  it("addProposal: only chair person can add proposals", async function () {
    const callData = firstProposal.interface.encodeFunctionData("setMessage");
    const _description = "First"
    await expect(dao.connect(alice).addProposal(callData, firstProposal.address, _description)).to.be.revertedWith("only Chair Person can add proposals")
  });

  it("vote: checking that you are investor", async function () {
    const callData = firstProposal.interface.encodeFunctionData("setMessage");
    const amountToken = 1000;
    const _description = "First"
    await token.approve(dao.address, amountToken);
    await dao.deposit(amountToken);
    await dao.addProposal(callData, firstProposal.address, _description)
    await expect(dao.connect(alice).vote(0, true)).to.be.revertedWith("you are not investor");
  });

  it("vote: checking that voting for proposal can be done only one time", async function () {
    const callData = firstProposal.interface.encodeFunctionData("setMessage");
    const amountToken = 1000;
    const _description = "First"
    await token.approve(dao.address, amountToken);
    await dao.deposit(amountToken);
    await dao.addProposal(callData, firstProposal.address, _description);
    await dao.vote(0, true);
    await expect(dao.vote(0, true)).to.be.revertedWith("you voted for this proposal already");
  });

  it("vote: checking that proposal id exists", async function () {
    const callData = firstProposal.interface.encodeFunctionData("setMessage");
    const amountToken = 1000;
    const _description = "First"
    await token.approve(dao.address, amountToken);
    await dao.deposit(amountToken);
    await dao.addProposal(callData, firstProposal.address, _description);
    await dao.vote(0, true);
    await expect(dao.vote(1, true)).to.be.revertedWith("proposal with this ID doesn't exist");
  });

  it("finishProposal: checking that time is not over", async function () {
    const callData = firstProposal.interface.encodeFunctionData("setMessage");
    const _description = "First"
    const timeLock = (3 * 24 * 60 * 60) - 100;
    await token.approve(dao.address, 1100);
    await dao.deposit(1000);
    await dao.addProposal(callData, firstProposal.address, _description);
    await dao.vote(0, true);
    await network.provider.send("evm_increaseTime", [timeLock]);
    await network.provider.send("evm_mine");
    await expect(dao.finishProposal(0)).to.be.revertedWith("Auction is not over");
  });

  it("finishProposal: checking that time is not over", async function () {
    const callData = firstProposal.interface.encodeFunctionData("setMessage");
    const _description = "First"
    const timeLock = (3 * 24 * 60 * 60)
    await token.approve(dao.address, 1100);
    await dao.deposit(1000);
    await dao.addProposal(callData, firstProposal.address, _description);
    await dao.vote(0, true);
    await network.provider.send("evm_increaseTime", [timeLock]);
    await network.provider.send("evm_mine");
    await dao.finishProposal(0);
  });

  it("finishProposal: checking that call works", async function () {
    const callData = firstProposal.interface.encodeFunctionData("setMessage");
    const _description = "First";
    const timeLock = (3 * 24 * 60 * 60);
    const varAfterCall = "Hack";
    await token.transfer(alice.address, 1000);
    await token.approve(dao.address, 1100);
    await token.connect(alice).approve(dao.address, 1100);
    await dao.deposit(1000);
    await dao.connect(alice).deposit(1000);
    await dao.addProposal(callData, firstProposal.address, _description);
    await dao.vote(0, true);
    await dao.connect(alice).vote(0, true);
    await network.provider.send("evm_increaseTime", [timeLock]);
    await network.provider.send("evm_mine");
    console.log(await firstProposal.print());
    await dao.finishProposal(0);
    expect(await firstProposal.print()).to.be.equal(varAfterCall);
  });
})
