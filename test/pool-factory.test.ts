import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import POOL_PARAMS, { PoolInfo, BaseContract } from "../scripts/constants/pool-params";
import { incrementBlocktimestamp, toWei, getBlockTimestamp, filterObject } from "../scripts/helpers";

const METATIME_TOKEN_SUPPLY = 10_000_000_000;
const STAKING_POOL_AMOUNT = 500_000_000;
const MARKETING_POOL_AMOUNT = 300_000_000;

describe("Distributor", function () {
    async function initiateVariables() {
        const [deployer, user_1, user_2, user_3, user_4, user_5] =
            await ethers.getSigners();

        const PoolFactory = await ethers.getContractFactory(
            CONTRACTS.utils.PoolFactory
        );
        const poolFactory = await PoolFactory.connect(deployer).deploy();

        return {
            poolFactory,
            deployer,
        };
    }

    describe("Initiate", async () => {
        it("Initiate Distributor contract & claim amounts", async function () {
            const {
                poolFactory,
                deployer,
            } = await loadFixture(initiateVariables);

            const currentBlockTimestamp = await getBlockTimestamp(ethers);
            const LISTING_TIMESTAMP = currentBlockTimestamp + 500_000;
            const SECONDS_IN_A_DAY = 60 * 24 * 60;

            // Pools that is derived from Distributor contract
            const distributors = filterObject(POOL_PARAMS, ([k, v]) => v.baseContract === BaseContract.Distributor);
            // Pools that is derived from TokenDistributor contract
            const tokenDistributors = filterObject(POOL_PARAMS, ([k, v]) => v.baseContract === BaseContract.TokenDistributor);

            // await poolFactory.connect(deployer).createDistributor();
        });
    });
});