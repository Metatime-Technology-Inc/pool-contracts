import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import POOL_PARAMS, { PoolInfo, BaseContract } from "../scripts/constants/pool-params";
import { incrementBlocktimestamp, toWei, getBlockTimestamp, filterObject } from "../scripts/helpers";
import { BigNumber } from "ethers";

const METATIME_TOKEN_SUPPLY = 10_000_000_000;
const SECONDS_IN_A_DAY = 60 * 24 * 60;

describe("Distributor", function () {
    async function initiateVariables() {
        const [deployer, user_1, user_2, user_3, user_4, user_5, user_6] =
            await ethers.getSigners();

        const MTC = await ethers.getContractFactory(
            CONTRACTS.core.MTC
        );
        const mtc = await MTC.connect(deployer).deploy(toWei(String(METATIME_TOKEN_SUPPLY)));

        const PoolFactory = await ethers.getContractFactory(
            CONTRACTS.utils.PoolFactory
        );
        const poolFactory = await PoolFactory.connect(deployer).deploy();

        const TokenDistributor = await ethers.getContractFactory(
            CONTRACTS.core.TokenDistributor
        );
        const tokenDistributor = await TokenDistributor.connect(deployer).deploy();

        return {
            mtc,
            poolFactory,
            deployer,
            tokenDistributor,
            user_1,
            user_2,
            user_3,
            user_4,
            user_5,
            user_6
        };
    }

    describe("Create distributors and test claiming period", async () => {
        it("Initiate TokenDistributor contract & test claims", async function () {
            const {
                mtc,
                poolFactory,
                deployer,
                user_1,
                user_2,
                user_3,
                user_4,
                user_5,
                user_6
            } = await loadFixture(initiateVariables);

            const currentBlockTimestamp = await getBlockTimestamp(ethers);
            const LISTING_TIMESTAMP = currentBlockTimestamp + 500_000;

            // Pools that is derived from TokenDistributor contract
            const tokenDistributors = filterObject(POOL_PARAMS, ([k, v]) => v.baseContract === BaseContract.TokenDistributor);

            const tokenDistributorKeys = Object.keys(tokenDistributors);

            // *** Test token distributor creation
            const testTokenDistributor = POOL_PARAMS.PUBLIC_SALE_POOL;
            const truePoolInfo = {
                poolName: testTokenDistributor.poolName,
                token: mtc.address,
                startTime: LISTING_TIMESTAMP,
                endTime: LISTING_TIMESTAMP + (testTokenDistributor.vestingDurationInDays * SECONDS_IN_A_DAY),
                distributionRate: testTokenDistributor.distributionRate,
                periodLength: testTokenDistributor.periodLength,
            };
            const falsePoolInfo = {
                poolName: testTokenDistributor.poolName,
                token: mtc.address,
                startTime: LISTING_TIMESTAMP,
                endTime: LISTING_TIMESTAMP + (testTokenDistributor.vestingDurationInDays * SECONDS_IN_A_DAY) + 1000,
                distributionRate: testTokenDistributor.distributionRate,
                periodLength: testTokenDistributor.periodLength,
            };

            // -- Test false pool params and expect method to revert
            await expect(poolFactory.connect(deployer).createTokenDistributor(
                falsePoolInfo.poolName,
                falsePoolInfo.token,
                falsePoolInfo.startTime,
                falsePoolInfo.endTime,
                falsePoolInfo.distributionRate,
                falsePoolInfo.periodLength,
            )).to.rejectedWith("isParamsValid: Invalid parameters");

            // -- Test true pool params
            await poolFactory.connect(deployer).createTokenDistributor(
                truePoolInfo.poolName,
                truePoolInfo.token,
                truePoolInfo.startTime,
                truePoolInfo.endTime,
                truePoolInfo.distributionRate,
                truePoolInfo.periodLength,
            );

            const currentTokenDistributorId = await poolFactory.connect(deployer).tokenDistributorCount();
            expect(currentTokenDistributorId).to.be.equal(BigNumber.from(1));

            // --- submit 0x address then test this value
            const createdTokenDistributorAddress = await poolFactory.getTokenDistributor(0);
            const tokenDistributorInstance = await ethers.getContractFactory(CONTRACTS.core.TokenDistributor);
            const createdTokenDistributor = tokenDistributorInstance.attach(createdTokenDistributorAddress);

            // --- try to update pool params before the claim period
            // ---- try with wrong address who is not the owner
            const ONE_WEEK_IN_SECS = SECONDS_IN_A_DAY * 7;

            await expect(createdTokenDistributor.connect(user_1).updatePoolParams(
                truePoolInfo.startTime + ONE_WEEK_IN_SECS,
                truePoolInfo.endTime + ONE_WEEK_IN_SECS,
                truePoolInfo.distributionRate,
                truePoolInfo.periodLength,
            )).to.rejectedWith("Ownable: caller is not the owner");

            await createdTokenDistributor.connect(deployer).updatePoolParams(
                truePoolInfo.startTime + ONE_WEEK_IN_SECS,
                truePoolInfo.endTime + ONE_WEEK_IN_SECS,
                truePoolInfo.distributionRate,
                truePoolInfo.periodLength,
            );

            const startTimeOfUpdatedPool = await createdTokenDistributor.startTime();
            const endTimeOfUpdatedPool = await createdTokenDistributor.endTime();

            expect(startTimeOfUpdatedPool).to.be.equal(truePoolInfo.startTime + ONE_WEEK_IN_SECS);
            expect(endTimeOfUpdatedPool).to.be.equal(truePoolInfo.endTime + ONE_WEEK_IN_SECS);

            // --- try to sweep pool before end of the claim period
            // ---- try with wrong address who is not the owner
            await expect(createdTokenDistributor.connect(user_1).sweep()).to.be.rejectedWith("Ownable: caller is not the owner");

            await expect(createdTokenDistributor.connect(deployer).sweep()).to.be.rejectedWith("sweep: Cannot sweep before claim end time");

            // --- submit address and amount to 0 balance pool
            await expect(createdTokenDistributor.setClaimableAmounts([user_1.address], [toWei(String(10_000_000))])).to.be.rejectedWith("Total claimable amount does not match");

            // ---- send mtc funds to distributor contract
            await mtc.connect(deployer).submitPools([
                [truePoolInfo.poolName, createdTokenDistributor.address, testTokenDistributor.lockedAmount]
            ]);

            // --- submit true addresses and amounts after funds sent then test it
            const addrs = [user_1.address, user_2.address, user_3.address, user_4.address, user_5.address];
            const addrAmounts = [
                toWei(String(40_000_000)),
                toWei(String(20_000_000)),
                toWei(String(60_000_000)),
                toWei(String(10_000_000)),
                toWei(String(70_000_000))
            ];

            await createdTokenDistributor.setClaimableAmounts(addrs, addrAmounts);

            // --- calculate claimable amount after some time passed
            await incrementBlocktimestamp(ethers, 500_000 + ONE_WEEK_IN_SECS * 2);

            await createdTokenDistributor.connect(user_1).claim();
            await createdTokenDistributor.connect(user_2).claim();
            await createdTokenDistributor.connect(user_3).claim();
            await createdTokenDistributor.connect(user_4).claim();
            await createdTokenDistributor.connect(user_5).claim();

            const user_1BalanceAfterClaim = await mtc.balanceOf(user_1.address);
            const user_2BalanceAfterClaim = await mtc.balanceOf(user_2.address);
            const user_3BalanceAfterClaim = await mtc.balanceOf(user_3.address);
            const user_4BalanceAfterClaim = await mtc.balanceOf(user_4.address);
            const user_5BalanceAfterClaim = await mtc.balanceOf(user_5.address);

            // Expect user_6 being reverted because this address was not submitted to contract
            await expect(createdTokenDistributor.connect(user_6).claim()).to.be.revertedWith("No tokens to claim");

            const user_1ClaimedAmount = await createdTokenDistributor.claimedAmounts(user_1.address);
            const user_2ClaimedAmount = await createdTokenDistributor.claimedAmounts(user_2.address);
            const user_3ClaimedAmount = await createdTokenDistributor.claimedAmounts(user_3.address);
            const user_4ClaimedAmount = await createdTokenDistributor.claimedAmounts(user_4.address);
            const user_5ClaimedAmount = await createdTokenDistributor.claimedAmounts(user_5.address);

            expect(user_1BalanceAfterClaim).to.be.equal(user_1ClaimedAmount);
            expect(user_2BalanceAfterClaim).to.be.equal(user_2ClaimedAmount);
            expect(user_3BalanceAfterClaim).to.be.equal(user_3ClaimedAmount);
            expect(user_4BalanceAfterClaim).to.be.equal(user_4ClaimedAmount);
            expect(user_5BalanceAfterClaim).to.be.equal(user_5ClaimedAmount);

            // --- increase blocktimestamp and try to calculate claimable amounts after end of the claim period
            await incrementBlocktimestamp(ethers, 10_000_000);
            const claimableAmountForUser1 = await createdTokenDistributor.claimableAmounts(user_1.address);
            const calculatedClaimableAmountForUser1AfterEndOfTheClaim = await createdTokenDistributor.calculateClaimableAmount(user_1.address);
            expect(calculatedClaimableAmountForUser1AfterEndOfTheClaim).to.be.equal(BigNumber.from(claimableAmountForUser1).sub(user_1ClaimedAmount));

            // --- try to sweep pool after end of the claim period
            await createdTokenDistributor.connect(deployer).sweep();
            const poolBalanceAfterSweep = await mtc.balanceOf(createdTokenDistributor.address);
            expect(poolBalanceAfterSweep).to.be.equal(0);
        });
    }).timeout(10000);
});