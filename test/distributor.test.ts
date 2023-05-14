import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import { incrementBlocktimestamp, toWei, getBlockTimestamp } from "../scripts/helpers";

const METATIME_TOKEN_SUPPLY = 10_000_000_000;
const STAKING_POOL_AMOUNT = 500_000_000;
const MARKETING_POOL_AMOUNT = 300_000_000;

describe("Distributor", function () {
    async function initiateVariables() {
        const [deployer] =
            await ethers.getSigners();

        const DistributorProxyManager = await ethers.getContractFactory(
            CONTRACTS.utils.DistributorProxyManager
        );
        const MetatimeToken = await ethers.getContractFactory(
            CONTRACTS.core.MetatimeToken,
        );
        const distributorProxyManager = await DistributorProxyManager.connect(deployer).deploy();
        const metatimeToken = await MetatimeToken.connect(deployer).deploy();

        return {
            distributorProxyManager,
            metatimeToken,
            deployer,
        };
    }

    describe("Initiate", async () => {
        it("Initiate Distributor contract & claim amounts", async function () {
            const {
                distributorProxyManager,
                metatimeToken,
                deployer,
            } = await loadFixture(initiateVariables);

            const currentBlockTimestamp = await getBlockTimestamp(ethers);
            const LISTING_TIMESTAMP = currentBlockTimestamp + 500_000;
            const SECONDS_IN_A_DAY = 60 * 24 * 60;

            const poolInfo = [
                {
                    name: "Staking Pool",
                    token: metatimeToken.address,
                    startTime: LISTING_TIMESTAMP,
                    endTime: LISTING_TIMESTAMP + (SECONDS_IN_A_DAY * 1000),
                    distributionRate: 2,
                    period: 86_400,
                    claimableAmount: toWei(String(STAKING_POOL_AMOUNT))
                },
                {
                    name: "Marketing Pool",
                    token: metatimeToken.address,
                    startTime: LISTING_TIMESTAMP,
                    endTime: LISTING_TIMESTAMP + (SECONDS_IN_A_DAY * 180),
                    distributionRate: 1_500,
                    period: 2_592_000,
                    claimableAmount: toWei(String(MARKETING_POOL_AMOUNT))
                }
            ];

            const createPoolProxyPromisesList = poolInfo.map(async (pi) => {
                const tx = await distributorProxyManager.connect(deployer).createPoolProxy(pi.name, pi.token, pi.startTime, pi.endTime, pi.distributionRate, pi.period, pi.claimableAmount);
                return await tx.wait();
            });

            await Promise.all(createPoolProxyPromisesList);

            const stakingPoolAddress = await distributorProxyManager.getPoolProxy(0);
            const marketingPoolAddress = await distributorProxyManager.getPoolProxy(1);

            const TokenDistributor = await ethers.getContractFactory(CONTRACTS.core.TokenDistributor);
            const stakingPoolProxy = TokenDistributor.attach(stakingPoolAddress);
            const marketingPoolProxy = TokenDistributor.attach(marketingPoolAddress);

            expect(await stakingPoolProxy.poolName()).to.be.equal(poolInfo[0].name);
            expect(await marketingPoolProxy.poolName()).to.be.equal(poolInfo[1].name);

            const balanceOfDeployer = await metatimeToken.connect(deployer).balanceOf(deployer.address);
            expect(balanceOfDeployer).to.be.equal(toWei(String(METATIME_TOKEN_SUPPLY)));

            const transferStakingPoolFunds = await metatimeToken.connect(deployer).transfer(stakingPoolProxy.address, toWei(String(STAKING_POOL_AMOUNT)));
            const transferMarketingPoolFunds = await metatimeToken.connect(deployer).transfer(marketingPoolProxy.address, toWei(String(MARKETING_POOL_AMOUNT)));

            await transferStakingPoolFunds.wait();
            await transferMarketingPoolFunds.wait();

            expect(await metatimeToken.balanceOf(stakingPoolProxy.address)).to.be.equal(toWei(String(STAKING_POOL_AMOUNT)));
            expect(await metatimeToken.balanceOf(marketingPoolProxy.address)).to.be.equal(toWei(String(MARKETING_POOL_AMOUNT)));

            expect(await stakingPoolProxy.owner()).to.be.equal(deployer.address);
            expect(await marketingPoolProxy.owner()).to.be.equal(deployer.address);

            // This is equal to approximately 1 days+ of claim amount of each address
            await incrementBlocktimestamp(ethers, 600_000);

            let stakingPoolClaimTx = await stakingPoolProxy.connect(deployer).claim();
            await stakingPoolClaimTx.wait();

            expect(await marketingPoolProxy.connect(deployer).claim()).to.be.reverted;

            // This is equal to both seed sale 1 and public sale claim time
            await incrementBlocktimestamp(ethers, SECONDS_IN_A_DAY * 120);

            stakingPoolClaimTx = await stakingPoolProxy.connect(deployer).claim();
            await stakingPoolClaimTx.wait();

            let marketingPoolClaimTx = await marketingPoolProxy.connect(deployer).claim();
            await marketingPoolClaimTx.wait();

            expect(await stakingPoolProxy.connect(deployer).claim()).to.be.reverted;
            expect(await marketingPoolProxy.connect(deployer).claim()).to.be.reverted;
        });
    });
});