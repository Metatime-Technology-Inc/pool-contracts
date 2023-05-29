import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import { incrementBlocktimestamp, toWei, getBlockTimestamp } from "../scripts/helpers";

const LIQUIDITY_POOL_TOKEN_AMOUNT = 500_000_000;

describe("Private Sale Token Distributor", function () {
    async function initiateVariables() {
        const [deployer] =
            await ethers.getSigners();

        const MetatimeToken = await ethers.getContractFactory(
            CONTRACTS.core.MetatimeToken,
        );
        const metatimeToken = await MetatimeToken.connect(deployer).deploy();

        return {
            metatimeToken,
            deployer,
        };
    }

    describe("Initiate", async () => {
        it("Initiate Liquidity contract & claim amounts", async function () {
            const {
                metatimeToken,
                deployer,
            } = await loadFixture(initiateVariables);

            const LiquidityPool = await ethers.getContractFactory(
                CONTRACTS.core.LiquidityPool
            );

            const liquidityPool = await LiquidityPool.connect(deployer).deploy(metatimeToken.address);

            const sendFundsToPoolTx = await metatimeToken.connect(deployer).transfer(liquidityPool.address, toWei(String(LIQUIDITY_POOL_TOKEN_AMOUNT)));
            await sendFundsToPoolTx.wait();

            expect(await metatimeToken.balanceOf(liquidityPool.address)).to.be.equal(toWei(String(LIQUIDITY_POOL_TOKEN_AMOUNT)));

            const deployerBalance = await metatimeToken.balanceOf(deployer.address);

            const TRANSFERRED_FUNDS = 1_000_000;
            const transferFundsTx = await liquidityPool.connect(deployer).transferFunds(toWei(String(TRANSFERRED_FUNDS)));
            await transferFundsTx.wait();

            expect(await metatimeToken.balanceOf(deployer.address)).to.be.equal(ethers.BigNumber.from(deployerBalance).add(toWei(String(TRANSFERRED_FUNDS))));
        });
    });
});