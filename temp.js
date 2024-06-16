const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealEstate Contract", function () {
  let RealEstate;
  let realEstate;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    RealEstate = await ethers.getContractFactory("RealEstate");
    [owner, addr1, addr2] = await ethers.getSigners();
    

    realEstate = await RealEstate.deploy();
    await realEstate.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await realEstate.owner()).to.equal(owner.address);
    });

    it("Should have zero total supply initially", async function () {
      expect(await realEstate.totalSupply()).to.equal(0);
    });
  });

  describe("Transactions", function () {
    it("Should mint a new token and update total supply", async function () {
      const tokenURI = "https://example.com/token/1";
      await realEstate.mint(tokenURI);

      expect(await realEstate.totalSupply()).to.equal(1);
      expect(await realEstate.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should allow multiple tokens to be minted", async function () {
      const tokenURI1 = "https://example.com/token/1";
      const tokenURI2 = "https://example.com/token/2";

      await realEstate.mint(tokenURI1);
      await realEstate.mint(tokenURI2);

      expect(await realEstate.totalSupply()).to.equal(2);
      expect(await realEstate.tokenURI(0)).to.equal(tokenURI1);
      expect(await realEstate.tokenURI(1)).to.equal(tokenURI2);
    });

    it("Should mint tokens to the right owner", async function () {
      const tokenURI = "https://example.com/token/1";
      await realEstate.connect(addr1).mint(tokenURI);

      expect(await realEstate.ownerOf(0)).to.equal(addr1.address);
    });
  });
});
