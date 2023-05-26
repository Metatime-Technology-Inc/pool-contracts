import { BigNumber } from "ethers";
import { toWei } from "../helpers";

interface TDPMCreatePoolProxy {
    poolName: string,
    distributionRate: number,
    period: number,
}

interface DPMCreatePoolProxy extends TDPMCreatePoolProxy {
    claimableAmount: BigNumber,
}

interface PoolParams {
    SEED_SALE_1_POOL: TDPMCreatePoolProxy,
    SEED_SALE_2_POOL: TDPMCreatePoolProxy,
    PUBLIC_SALE_POOL: TDPMCreatePoolProxy,
    AIRDROP_POOL: TDPMCreatePoolProxy,
    REWARDS_POOL: TDPMCreatePoolProxy,
    MINER_POOL: TDPMCreatePoolProxy,
    STAKING_POOL: DPMCreatePoolProxy,
    TEAM_POOL: DPMCreatePoolProxy,
    CHARITY_POOL: DPMCreatePoolProxy,
    MARKETING_POOL: DPMCreatePoolProxy,
}

const ONE_DAY_IN_SECS = 86400;
const ONE_MONTH_IN_SECS = 2592000;

const POOL_PARAMS: PoolParams = {
    SEED_SALE_1_POOL: {
        poolName: "Seed Sale 1",
        distributionRate: 40,
        period: ONE_DAY_IN_SECS
    },
    SEED_SALE_2_POOL: {
        poolName: "Seed Sale 2",
        distributionRate: 40,
        period: ONE_DAY_IN_SECS,
    },
    PUBLIC_SALE_POOL: {
        poolName: "Public Sale",
        distributionRate: 100,
        period: ONE_DAY_IN_SECS,
    },
    AIRDROP_POOL: {
        poolName: "Airdrop",
        distributionRate: 20,
        period: ONE_DAY_IN_SECS,
    },
    REWARDS_POOL: {
        poolName: "Rewards",
        distributionRate: 2,
        period: ONE_DAY_IN_SECS,
    },
    MINER_POOL: {
        poolName: "Miner",
        distributionRate: 5,
        period: ONE_DAY_IN_SECS,
    },
    STAKING_POOL: {
        poolName: "Staking",
        distributionRate: 2,
        period: ONE_DAY_IN_SECS,
        claimableAmount: toWei(String()),
    },
    TEAM_POOL: {
        poolName: "Team",
        distributionRate: 2,
        period: ONE_DAY_IN_SECS,
        claimableAmount: toWei(String(1_900_000_000)),
    },
    CHARITY_POOL: {
        poolName: "Charity",
        distributionRate: 10,
        period: ONE_DAY_IN_SECS,
        claimableAmount: toWei(String(100_000_000)),
    },
    MARKETING_POOL: {
        poolName: "Marketing",
        distributionRate: 1500,
        period: ONE_MONTH_IN_SECS,
        claimableAmount: toWei(String(300_000_00)),
    }
};

export default POOL_PARAMS;