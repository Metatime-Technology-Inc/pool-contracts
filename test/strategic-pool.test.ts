import { ethers, network } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { expect } from "chai";
import { CONTRACTS } from "../scripts/constants";
import {
  calculateBurnAmount,
  findMarginOfDeviation,
  toWei,
} from "../scripts/helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const STRATEGIC_POOL_BALANCE = 4_000_000_000;
const MARGIN_OF_DEVIATION = 0.1;

describe("StrategicPool", function () {
  let pool: Contract;
  let deployer: SignerWithAddress;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    const Pool = await ethers.getContractFactory(CONTRACTS.core.StrategicPool);
    pool = await Pool.connect(deployer).deploy();
  });

  // try to receive eth
  it("try to receive eth", async () => {
    const SENT_AMOUNT = toWei(String(1_000));

    await expect(
      deployer.sendTransaction({
        to: pool.address,
        value: SENT_AMOUNT,
      })
    )
      .to.emit(pool, "Deposit")
      .withArgs(deployer.address, SENT_AMOUNT, SENT_AMOUNT);
  });

  it("should init twice and expect to be reverted", async () => {
    await pool.connect(deployer).initialize();

    await expect(pool.connect(deployer).initialize()).revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("should burn tokens using the formula", async function () {
    await network.provider.send("hardhat_setBalance", [
      pool.address,
      toWei(String(STRATEGIC_POOL_BALANCE)).toHexString().replace(/0x0+/, "0x"),
    ]);

    const currentPrice = BigNumber.from(toWei(String(0.07)));
    const blocksInTwoMonths = BigNumber.from(1036800);

    const initialBalance = await pool.provider.getBalance(pool.address);

    const expectedAmount = await pool.calculateBurnAmount(
      currentPrice,
      blocksInTwoMonths
    );
    const calculatedBurnAmount = calculateBurnAmount(
      toWei(String(0.07)),
      1036800,
      1000,
      0
    );

    // try to compare burn amount and expect margin of deviation should be at most "defined margin of deviation value"
    expect(findMarginOfDeviation(expectedAmount, calculatedBurnAmount)).at.most(
      MARGIN_OF_DEVIATION
    );

    await pool.burnWithFormula(currentPrice, blocksInTwoMonths);

    const totalBurnedAmount = await pool.totalBurnedAmount();

    expect(totalBurnedAmount).to.equal(expectedAmount);
    expect(await pool.provider.getBalance(pool.address)).to.equal(
      initialBalance.sub(expectedAmount)
    );
  });

  it("should burn tokens without using the formula", async function () {
    await network.provider.send("hardhat_setBalance", [
      pool.address,
      toWei(String(1_500_000)).toHexString().replace(/0x0+/, "0x"),
    ]);

    const burnAmount = BigNumber.from(1000);

    const initialBalance = await pool.provider.getBalance(pool.address);

    await pool.burn(burnAmount);

    const totalBurnedAmount = await pool.totalBurnedAmount();

    expect(totalBurnedAmount).to.equal(burnAmount);
    expect(await pool.provider.getBalance(pool.address)).to.equal(
      initialBalance.sub(burnAmount)
    );
  });

  it("should revert when burning zero tokens with the formula", async function () {
    await network.provider.send("hardhat_setBalance", [
      pool.address,
      toWei(String(1_500_000)).toHexString().replace(/0x0+/, "0x"),
    ]);

    const currentPrice = BigNumber.from(10);
    const blocksInTwoMonths = BigNumber.from(100000);

    await expect(
      pool.burnWithFormula(currentPrice, blocksInTwoMonths)
    ).to.be.revertedWith("StrategicPool: unable to burn");
  });

  // Try to execute burnWithFormula with zero balance contract and expect to be reverted
  it("try to execute burnWithFormula with zero balance contract and expect to be reverted", async () => {
    const currentPrice = BigNumber.from(1);
    const blocksInTwoMonths = BigNumber.from(0);

    await expect(
      pool.burnWithFormula(currentPrice, blocksInTwoMonths)
    ).to.be.revertedWith("StrategicPool: amount must be bigger than zero");
  });

  it("try to burn when the strategic pool has zero balance", async () => {
    await expect(
      pool.connect(deployer).burn(toWei(String(1000)))
    ).to.be.revertedWith("StrategicPool: unable to burn");
  });
});
