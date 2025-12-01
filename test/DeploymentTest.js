import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";

describe("Deployment Script Test", function () {
  let admin, buyer, seller, arbiter;

  beforeEach(async () => {
    [buyer, seller, arbiter] = await ethers.getSigners();
  });

  it("deploy script should deploy Escrow with correct constructor params", async () => {
    // Mimic what your deploy.js script does
    const Escrow = await ethers.getContractFactory("Escrow", buyer);

    const escrow = await Escrow.deploy(
      seller.address,   // _seller
      arbiter.address   // _arbiter
    );

    // 1. Ensure contract address exists
    expect(escrow.target).to.properAddress;

    // 2. Correct buyer assigned (msg.sender = deployer)
    expect(await escrow.buyer()).to.equal(buyer.address);

    // 3. Correct seller assigned
    expect(await escrow.seller()).to.equal(seller.address);

    // 4. Correct arbiter assigned
    expect(await escrow.arbiter()).to.equal(arbiter.address);

    // 5. Contract starts with zero balance
    expect(await escrow.getBalance()).to.equal(0);

    // 6. Initial amount = 0
    expect(await escrow.amount()).to.equal(0);

    // 7. fundsReleased = false initially
    expect(await escrow.fundsReleased()).to.equal(false);

    // 8. No approvals or disputes initially
    expect(await escrow.buyerApproved()).to.equal(false);
    expect(await escrow.sellerApproved()).to.equal(false);
    expect(await escrow.disputed()).to.equal(false);
  });
});
