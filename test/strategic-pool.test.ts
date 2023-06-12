import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { expect } from "chai";
import { CONTRACTS } from "../scripts/constants";
import { toWei } from "../scripts/helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const METATIME_TOKEN_SUPPLY = 1_000_000_000;

describe("StrategicPool", function () {
    let pool: Contract;
    let mtc: Contract;
    let deployer: SignerWithAddress;

    beforeEach(async function () {
        [deployer] =
            await ethers.getSigners();

        const MTC = await ethers.getContractFactory(CONTRACTS.core.MTC);
        mtc = await MTC.connect(deployer).deploy(toWei(String(METATIME_TOKEN_SUPPLY)));
        await mtc.deployed();

        const Pool = await ethers.getContractFactory(CONTRACTS.core.StrategicPool);
        pool = await Pool.connect(deployer).deploy(mtc.address);
    });

    it("should burn tokens using the formula", async function () {
        await mtc.connect(deployer).transfer(pool.address, toWei(String(1_500_000)));

        const currentPrice = BigNumber.from(1000);
        const blocksInTwoMonths = BigNumber.from(100000);

        const initialBalance = await mtc.balanceOf(pool.address);

        const expectedAmount = await pool.calculateBurnAmount(currentPrice, blocksInTwoMonths);

        await pool.burnWithFormula(currentPrice, blocksInTwoMonths);

        const totalBurnedAmount = await pool.totalBurnedAmount();

        expect(totalBurnedAmount).to.equal(expectedAmount);
        expect(await mtc.balanceOf(pool.address)).to.equal(initialBalance.sub(expectedAmount));
    });

    it("should burn tokens without using the formula", async function () {
        await mtc.connect(deployer).transfer(pool.address, toWei(String(1_500_000)));

        const burnAmount = BigNumber.from(1000);

        const initialBalance = await mtc.balanceOf(pool.address);

        await pool.burn(burnAmount);

        const totalBurnedAmount = await pool.totalBurnedAmount();

        expect(totalBurnedAmount).to.equal(burnAmount);
        expect(await mtc.balanceOf(pool.address)).to.equal(initialBalance.sub(burnAmount));
    });

    it("should revert when burning zero tokens with the formula", async function () {
        await mtc.connect(deployer).transfer(pool.address, toWei(String(1_500_000)));

        const currentPrice = BigNumber.from(10);
        const blocksInTwoMonths = BigNumber.from(100000);

        await expect(pool.burnWithFormula(currentPrice, blocksInTwoMonths))
            .to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    // Try to deploy with 0x token address and expect to be reverted
    it("try to deploy with 0x token address", async () => {
        const Pool = await ethers.getContractFactory(CONTRACTS.core.StrategicPool);
        await expect(Pool.connect(deployer).deploy(ethers.constants.AddressZero)).to.be.revertedWith("StrategicPool: invalid token address");
    });

    // Try to execute burnWithFormula with zero balance contract and expect to be reverted
    it("try to execute burnWithFormula with zero balance contract and expect to be reverted", async () => {
        const currentPrice = BigNumber.from(1);
        const blocksInTwoMonths = BigNumber.from(0);

        await expect(pool.burnWithFormula(currentPrice, blocksInTwoMonths))
            .to.be.revertedWith("StrategicPool: amount must be bigger than zero");
    });
});
