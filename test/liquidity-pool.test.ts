import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import POOL_PARAMS, { PoolInfo, BaseContract } from "../scripts/constants/pool-params";
import { incrementBlocktimestamp, toWei, getBlockTimestamp, filterObject } from "../scripts/helpers";
import { BigNumber } from "ethers";

const METATIME_TOKEN_SUPPLY = 10_000_000_000;
const SECONDS_IN_A_DAY = 60 * 24 * 60;

describe("LiquidityPool", function () {
    async function initiateVariables() {
        const [deployer, randomUser] =
            await ethers.getSigners();

        const MTC = await ethers.getContractFactory(
            CONTRACTS.core.MTC
        );
        const mtc = await MTC.connect(deployer).deploy(toWei(String(METATIME_TOKEN_SUPPLY)));

        const LiquidityPool = await ethers.getContractFactory(
            CONTRACTS.core.LiquidityPool
        );
        const liquidityPool = await LiquidityPool.connect(deployer).deploy(mtc.address);

        return {
            mtc,
            liquidityPool,
            deployer,
            randomUser
        };
    }

    describe("Create distributors and test claiming period", async () => {
        it("Initiate Pool factory & create distributor pool", async function () {
            const {
                mtc,
                liquidityPool,
                deployer,
                randomUser
            } = await loadFixture(initiateVariables);

            // test transfer funds when no balance in pool
            await expect(liquidityPool.connect(deployer).transferFunds(toWei(String(1_000_000)))).to.be.revertedWith("_withdraw: No tokens to withdraw");

            // send funds to pool
            await mtc.connect(deployer).transfer(liquidityPool.address, POOL_PARAMS.LIQUIDITY_POOL.lockedAmount);
            const poolBalance = await mtc.balanceOf(liquidityPool.address);
            expect(poolBalance).to.be.equal(POOL_PARAMS.LIQUIDITY_POOL.lockedAmount);

            // try to transfer funds with address thats not owner of the contract
            await expect(liquidityPool.connect(randomUser).transferFunds(toWei(String(1_000_000)))).to.be.revertedWith("Ownable: caller is not the owner");

            // try to transfer funds
            const ownerBalanceBeforeTransfer = await mtc.balanceOf(deployer.address);
            await liquidityPool.connect(deployer).transferFunds(toWei(String(1_000_000)));
            const ownerBalanceAfterTransfer = await mtc.balanceOf(deployer.address);
            expect(ownerBalanceAfterTransfer).to.be.equal(BigNumber.from(ownerBalanceBeforeTransfer).add(toWei(String(1_000_000))));
        });
    });
});