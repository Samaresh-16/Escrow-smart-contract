import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";

describe("Escrow Contract", function () {
  let escrow, admin, buyer, seller, arbiter;

  beforeEach(async () => {
    [buyer, seller, arbiter] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("Escrow", buyer);
    escrow = await Escrow.deploy(seller.address, arbiter.address);
  });

  it("should set correct buyer, seller, and arbiter", async () => {
    expect(await escrow.buyer()).to.equal(buyer.address);
    expect(await escrow.seller()).to.equal(seller.address);
    expect(await escrow.arbiter()).to.equal(arbiter.address);
  });

  it("should allow buyer to deposit ETH", async () => {
    await expect(
      escrow.connect(buyer).deposit({ value: ethers.parseEther("1") })
    ).to.emit(escrow, "Deposited");

    expect(await escrow.amount()).to.equal(ethers.parseEther("1"));
    expect(await escrow.getBalance()).to.equal(ethers.parseEther("1"));
  });

  it("should prevent non-buyer from depositing", async () => {
    await expect(
      escrow.connect(seller).deposit({ value: ethers.parseEther("1") })
    ).to.be.revertedWith("Only buyer can call this");

    await expect(
      escrow.connect(arbiter).deposit({ value: ethers.parseEther("1") })
    ).to.be.revertedWith("Only buyer can call this");
  });

  it("should release funds when both buyer and seller approve", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });

    const before = await ethers.provider.getBalance(seller.address);

    await escrow.connect(buyer).approveRelease();
    await escrow.connect(seller).approveRelease(); // triggers release

    const after = await ethers.provider.getBalance(seller.address);

    expect(after).to.be.gt(before);
    expect(await escrow.fundsReleased()).to.equal(true);
  });

  it("should allow dispute to be raised", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });

    await expect(escrow.connect(buyer).raiseDispute()).to.emit(
      escrow,
      "Disputed"
    );

    expect(await escrow.disputed()).to.equal(true);
  });

  it("should not allow dispute to be raised twice", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });
    await escrow.connect(buyer).raiseDispute();

    await expect(
      escrow.connect(buyer).raiseDispute()
    ).to.be.revertedWith("Already disputed");
  });

  it("should allow arbiter to resolve dispute in favor of buyer", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });
    await escrow.connect(buyer).raiseDispute();

    const before = await ethers.provider.getBalance(buyer.address);

    await escrow.connect(arbiter).resolveDispute(buyer.address);

    const after = await ethers.provider.getBalance(buyer.address);
    expect(after).to.be.gt(before);
    expect(await escrow.fundsReleased()).to.equal(true);
  });

  it("should allow arbiter to resolve dispute in favor of seller", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });
    await escrow.connect(buyer).raiseDispute();

    const before = await ethers.provider.getBalance(seller.address);

    await escrow.connect(arbiter).resolveDispute(seller.address);

    const after = await ethers.provider.getBalance(seller.address);
    expect(after).to.be.gt(before);
    expect(await escrow.fundsReleased()).to.equal(true);
  });

  it("should revert if non-arbiter tries to resolve dispute", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });
    await escrow.connect(buyer).raiseDispute();

    await expect(
      escrow.connect(buyer).resolveDispute(buyer.address)
    ).to.be.revertedWith("Only arbiter can call this");

    await expect(
      escrow.connect(seller).resolveDispute(seller.address)
    ).to.be.revertedWith("Only arbiter can call this");
  });

    it("should NOT release funds if only buyer approves", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });

    // Buyer approves but seller has not approved yet
    await escrow.connect(buyer).approveRelease();

    // Check that funds are not released
    expect(await escrow.fundsReleased()).to.equal(false);

    // ensure seller’s balance has NOT increased
    const sellerBalance = await ethers.provider.getBalance(seller.address);

    // sellerBalance should remain unchanged because funds were NOT released
    expect(await ethers.provider.getBalance(seller.address)).to.equal(sellerBalance);
  });

  it("should NOT release funds if only seller approves", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });

    // Seller approves but buyer has not approved yet
    await escrow.connect(seller).approveRelease();

    // fundsReleased must still be false
    expect(await escrow.fundsReleased()).to.equal(false);

    const sellerBalance = await ethers.provider.getBalance(seller.address);
    expect(await ethers.provider.getBalance(seller.address)).to.equal(sellerBalance);
  });

  it("should have fundsReleased = false before approval or dispute", async () => {
    await escrow.connect(buyer).deposit({ value: ethers.parseEther("1") });

    // No approval or dispute yet
    expect(await escrow.fundsReleased()).to.equal(false);
  });

});
