import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import POOL_PARAMS from "../scripts/constants/pool-params";
import { incrementBlocktimestamp, toWei, getBlockTimestamp } from "../scripts/helpers";
import { MTC, TokenDistributor2 } from "../typechain-types";

const METATIME_TOKEN_SUPPLY = 10_000_000_000;
const SECONDS_IN_A_DAY = 60 * 24 * 60;

describe("TokenDistributor2", function () {
    async function initiateVariables() {
        const [deployer, user_1, user_2, user_3, user_4, user_5] =
            await ethers.getSigners();

        const currentBlockTimestamp = await getBlockTimestamp(ethers);
        const LISTING_TIMESTAMP = currentBlockTimestamp + (SECONDS_IN_A_DAY * 2);

        const MTC = await ethers.getContractFactory(
            CONTRACTS.core.MTC
        );
        const mtc = await MTC.connect(deployer).deploy(toWei(String(METATIME_TOKEN_SUPPLY))) as MTC;

        const TokenDistributor2 = await ethers.getContractFactory(
            CONTRACTS.core.TokenDistributor2
        );
        const periodDurationInSeconds = LISTING_TIMESTAMP + (SECONDS_IN_A_DAY * 10);
        const privateSaleTokenDistributor = await TokenDistributor2.connect(deployer)
            .deploy(mtc.address, LISTING_TIMESTAMP, LISTING_TIMESTAMP + periodDurationInSeconds) as TokenDistributor2;

        return {
            mtc,
            privateSaleTokenDistributor,
            deployer,
            user_1,
            user_2,
            user_3,
            user_4,
            user_5,
            LISTING_TIMESTAMP,
            periodDurationInSeconds
        };
    }

    describe("Create TokenDistributor2 & test claim period", async () => {
        // try to create with wrong constructor params
        it("try to create with wrong constructor params", async function () {
            const {
                deployer,
                mtc,
            } = await loadFixture(initiateVariables);

            const TokenDistributor2 = await ethers.getContractFactory(
                CONTRACTS.core.TokenDistributor2
            );

            const currentBlockTimestamp = await getBlockTimestamp(ethers);
            const LISTING_TIMESTAMP = currentBlockTimestamp + (SECONDS_IN_A_DAY * 2);
            const periodDurationInSeconds = LISTING_TIMESTAMP + (SECONDS_IN_A_DAY * 10);

            await expect(TokenDistributor2.connect(deployer)
                .deploy(ethers.constants.AddressZero, LISTING_TIMESTAMP, LISTING_TIMESTAMP + periodDurationInSeconds)).to.be.revertedWith("TokenDistributor2: invalid token address");

            await expect(TokenDistributor2.connect(deployer)
                .deploy(mtc.address, LISTING_TIMESTAMP + periodDurationInSeconds, LISTING_TIMESTAMP)).to.be.revertedWith("TokenDistributor2: end time must be bigger than start time");
        });

        it("should initiate pool & test claim period", async function () {
            const {
                mtc,
                privateSaleTokenDistributor,
                deployer,
                user_1,
                user_2,
                user_3,
                user_4,
                user_5,
                LISTING_TIMESTAMP,
                periodDurationInSeconds
            } = await loadFixture(initiateVariables);

            // Set addresses and their amounts with no balance and expect revert
            const addrs = [user_1.address, user_2.address, user_3.address, user_4.address];
            const amounts = [toWei(String(10_000_000)), toWei(String(25_000_000)), toWei(String(60_000_000)), toWei(String(5_000_000))];

            await expect(privateSaleTokenDistributor.connect(deployer).setClaimableAmounts(addrs, amounts))
                .to.be.revertedWith("TokenDistributor2: total claimable amount does not match");

            // Send funds and try to set addresses and their amounts
            await mtc.connect(deployer).transfer(privateSaleTokenDistributor.address, POOL_PARAMS.PRIVATE_SALE_POOL.lockedAmount);

            await privateSaleTokenDistributor.connect(deployer).setClaimableAmounts(addrs, amounts);

            // try send mismatched length of address and amount list and expect to be reverted
            await expect(privateSaleTokenDistributor.connect(deployer).setClaimableAmounts([addrs[0]], amounts)).to.be.revertedWith("TokenDistributor2: user and amount list lengths must match");
            
            // try to set address again
            await expect(privateSaleTokenDistributor.connect(deployer).setClaimableAmounts([addrs[0]], [amounts[0]])).to.be.revertedWith("TokenDistributor2: address already set");

            // try to set 0x address and expect to be reverted
            await expect(privateSaleTokenDistributor.connect(deployer).setClaimableAmounts([ethers.constants.AddressZero], [toWei(String(1_000))])).to.be.revertedWith("TokenDistributor2: cannot set zero address");

            const user_1ClaimableAmounts = await privateSaleTokenDistributor.claimableAmounts(user_1.address);
            const user_2ClaimableAmounts = await privateSaleTokenDistributor.claimableAmounts(user_2.address);
            const user_3ClaimableAmounts = await privateSaleTokenDistributor.claimableAmounts(user_3.address);
            const user_4ClaimableAmounts = await privateSaleTokenDistributor.claimableAmounts(user_4.address);

            expect(user_1ClaimableAmounts).to.be.equal(toWei(String(10_000_000)));
            expect(user_2ClaimableAmounts).to.be.equal(toWei(String(25_000_000)));
            expect(user_3ClaimableAmounts).to.be.equal(toWei(String(60_000_000)));
            expect(user_4ClaimableAmounts).to.be.equal(toWei(String(5_000_000)));

            // Try to claim before distribution start time
            await expect(privateSaleTokenDistributor.connect(user_1).claim()).to.be.revertedWith("TokenDistributor2: tokens cannot be claimed yet");

            // Try to set addresses and their amounts after claim started and expect revert
            await incrementBlocktimestamp(ethers, SECONDS_IN_A_DAY * 3);
            await expect(privateSaleTokenDistributor.connect(deployer).setClaimableAmounts([user_5.address], [toWei(String(1_000_000))]))
                .to.be.revertedWith("TokenDistributor2: claim period has already started");

            // Try to claim tokens with wrong address
            await expect(privateSaleTokenDistributor.connect(user_5).claim())
                .to.be.revertedWith("TokenDistributor2: no tokens to claim");

            // Try to claim tokens with true addresses
            await privateSaleTokenDistributor.connect(user_1).claim();
            await privateSaleTokenDistributor.connect(user_2).claim();
            await privateSaleTokenDistributor.connect(user_3).claim();

            const user_1Balance = await mtc.balanceOf(user_1.address);
            const user_2Balance = await mtc.balanceOf(user_2.address);
            const user_3Balance = await mtc.balanceOf(user_3.address);

            expect(user_1Balance).to.be.equal(toWei(String(10_000_000)));
            expect(user_2Balance).to.be.equal(toWei(String(25_000_000)));
            expect(user_3Balance).to.be.equal(toWei(String(60_000_000)));

            // try to sweep before claim period end
            await expect(privateSaleTokenDistributor.connect(deployer).sweep()).to.be.revertedWith("TokenDistributor2: cannot sweep before claim end time");

            // try to claim after claim period end
            await incrementBlocktimestamp(ethers, (SECONDS_IN_A_DAY * 1000) + periodDurationInSeconds);
            await expect(privateSaleTokenDistributor.connect(user_4).claim()).to.be.revertedWith("TokenDistributor2: claim period has ended");

            // try to sweep after claim period end
            await privateSaleTokenDistributor.connect(deployer).sweep();

            // try to sweep again
            await expect(privateSaleTokenDistributor.connect(deployer).sweep()).to.be.revertedWith("TokenDistributor2: no leftovers");
        });
    });
});