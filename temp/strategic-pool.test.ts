import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import { incrementBlocktimestamp, toWei, getBlockTimestamp } from "../scripts/helpers";

const STRATEGIC_POOL_AMOUNT = 4_000_000_000;

describe("Strategic Pool", function () {
    async function initiateVariables() {
        const [deployer] =
            await ethers.getSigners();

        const MetatimeToken = await ethers.getContractFactory(
            CONTRACTS.core.MetatimeToken,
        );
        const StrategicPool = await ethers.getContractFactory(
            CONTRACTS.core.StrategicPool,
        );
        const metatimeToken = await MetatimeToken.connect(deployer).deploy();
        const strategicPool = await StrategicPool.connect(deployer).deploy(metatimeToken.address);

        return {
            strategicPool,
            metatimeToken,
            deployer,
        };
    }

    describe("Initiate", async () => {
        it("Initiate StrategicPool contract & claim amounts", async function () {
            const {
                strategicPool,
                metatimeToken,
                deployer,
            } = await loadFixture(initiateVariables);

            const sendFundsToStrategicPoolTx = await metatimeToken.connect(deployer).transfer(strategicPool.address, toWei(String(STRATEGIC_POOL_AMOUNT)));
            await sendFundsToStrategicPoolTx.wait();

            expect(await metatimeToken.balanceOf(strategicPool.address)).to.be.equal(toWei(String(STRATEGIC_POOL_AMOUNT)));

            const BURN_AMOUNT_1 = 10_000_000;
            const manuelBurnTx = await strategicPool.connect(deployer).burn(toWei(String(BURN_AMOUNT_1)));
            await manuelBurnTx.wait();

            expect(await metatimeToken.balanceOf(strategicPool.address)).to.be.equal(toWei(String(STRATEGIC_POOL_AMOUNT - BURN_AMOUNT_1)));

            const BLOCK_AMOUNT_IN_TWO_MONTHS = 1_036_800;
            const LIQUIDITY_PRICE = 5;
            const calculatedBurnAmount = await strategicPool.connect(deployer).calculateBurnAmount(LIQUIDITY_PRICE, BLOCK_AMOUNT_IN_TWO_MONTHS);

            const burnWithFormulaTx = await strategicPool.connect(deployer).burnWithFormula(LIQUIDITY_PRICE, BLOCK_AMOUNT_IN_TWO_MONTHS);
            await burnWithFormulaTx.wait();

            expect(await metatimeToken.balanceOf(strategicPool.address)).to.be.equal(toWei(String(STRATEGIC_POOL_AMOUNT - BURN_AMOUNT_1)).sub(calculatedBurnAmount));

            const WITHDRAWAL_AMOUNT = 100_000;
            const withdrawTx = await strategicPool.connect(deployer).withdraw(toWei(String(WITHDRAWAL_AMOUNT)));
            await withdrawTx.wait();

            expect(await metatimeToken.balanceOf(strategicPool.address)).to.be.equal(toWei(String(STRATEGIC_POOL_AMOUNT - BURN_AMOUNT_1 - WITHDRAWAL_AMOUNT)).sub(calculatedBurnAmount));
        });
    });
});