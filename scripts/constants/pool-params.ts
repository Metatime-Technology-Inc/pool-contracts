import { BigNumber } from "ethers";
import { toWei } from "../helpers";

interface PoolInfo {
    poolName: string,
    distributionRate: number,
    periodLength: number,
    lockedAmount: BigNumber,
    vestingDurationInDays: number,
    hasVesting: boolean,
}

interface PoolParams {
    SEED_SALE_1_POOL: PoolInfo,
    SEED_SALE_2_POOL: PoolInfo,
    PRIVATE_SALE_POOL: PoolInfo,
    PUBLIC_SALE_POOL: PoolInfo,
    STRATEGIC_POOL: PoolInfo,
    LIQUIDITY_POOL: PoolInfo,
    MARKETING_POOL: PoolInfo,
    AIRDROP_POOL: PoolInfo,
    STAKING_POOL: PoolInfo,
    REWARDS_POOL: PoolInfo,
    MINER_POOL: PoolInfo,
    TEAM_POOL: PoolInfo,
    CHARITY_POOL: PoolInfo,
}

const ONE_DAY_IN_SECS = 86400;

const POOL_PARAMS: PoolParams = {
    /**
     * Pool name: Seed Sale 1
     * Total allocated token amounts: 1,000,000 MTC
     * Vesting: 250 days linear
     * Distribution rate: 0.4% daily
     */
    SEED_SALE_1_POOL: {
        poolName: "Seed Sale 1",
        distributionRate: 40,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(100_000_000)),
        vestingDurationInDays: 250,
        hasVesting: true,
    },
    /**
     * Pool name: Seed Sale 2
     * Total allocated token amounts: 100,000,000 MTC
     * Vesting: 250 days linear
     * Distribution rate: 0.4% daily
     */
    SEED_SALE_2_POOL: {
        poolName: "Seed Sale 2",
        distributionRate: 40,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(100_000_000)),
        vestingDurationInDays: 250,
        hasVesting: true,
    },
    /**
     * Pool name: Private Sale
     * Total allocated token amounts: 100,000,000 MTC
     * Vesting: None
     * Distribution rate: 100%
     */
    PRIVATE_SALE_POOL: {
        poolName: "Private Sale",
        distributionRate: 0,
        periodLength: 0,
        lockedAmount: toWei(String(100_000_000)),
        vestingDurationInDays: 0,
        hasVesting: false
    },
    /**
     * Pool name: Public Sale
     * Total allocated token amounts: 200,000,000 MTC
     * Vesting: 100 days linear
     * Distribution rate: 1% daily
     */
    PUBLIC_SALE_POOL: {
        poolName: "Public Sale",
        distributionRate: 100,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(200_000_000)),
        vestingDurationInDays: 100,
        hasVesting: true
    },
    /**
     * Pool name: Strategic
     * Total allocated token amounts: 4,000,000,000 MTC
     * Vesting: None
     * Distribution rate: None
     */
    STRATEGIC_POOL: {
        poolName: "Strategic",
        distributionRate: 0,
        periodLength: 0,
        lockedAmount: toWei(String(4_000_000_000)),
        vestingDurationInDays: 0,
        hasVesting: false
    },
    /**
     * Pool name: Liquidity
     * Total allocated token amounts: 500,000,000 MTC
     * Vesting: None
     * Distribution rate: None
     */
    LIQUIDITY_POOL: {
        poolName: "Liquidity",
        distributionRate: 0,
        periodLength: 0,
        lockedAmount: toWei(String(500_000_000)),
        vestingDurationInDays: 0,
        hasVesting: false
    },
    /**
     * Pool name: Marketing
     * Total allocated token amounts: 800,000,000 MTC
     * Vesting: 500 days linear
     * Distribution rate: 0.2% daily
     */
    MARKETING_POOL: {
        poolName: "Marketing",
        distributionRate: 20,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(800_000_000)),
        vestingDurationInDays: 500,
        hasVesting: true
    },
    /**
     * Pool name: Airdrop
     * Total allocated token amounts: 200,000,000 MTC
     * Vesting: 500 days linear
     * Distribution rate: 0.2% daily
     */
    AIRDROP_POOL: {
        poolName: "Airdrop",
        distributionRate: 20,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(200_000_000)),
        vestingDurationInDays: 5_00,
        hasVesting: true
    },
    /**
     * Pool name: Staking
     * Total allocated token amounts: 500,000,000 MTC
     * Vesting: 1,000 days linear
     * Distribution rate: 0.1% daily
     */
    STAKING_POOL: {
        poolName: "Staking",
        distributionRate: 10,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(500_000_000)),
        vestingDurationInDays: 1_000,
        hasVesting: true
    },
    /**
     * Pool name: Rewards
     * Total allocated token amounts: 500,000,000 MTC
     * Vesting: 5,000 days linear
     * Distribution rate: 0.02%
     */
    REWARDS_POOL: {
        poolName: "Rewards",
        distributionRate: 2,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(500_000_000)),
        vestingDurationInDays: 5_000,
        hasVesting: true
    },
    /**
     * Pool name: Miner
     * Total allocated token amounts: 1,000,000,000 MTC
     * Vesting: 2,000 days linear
     * Distribution rate: 0.05%
     */
    MINER_POOL: {
        poolName: "Miner",
        distributionRate: 5,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(1_000_000_000)),
        vestingDurationInDays: 2_000,
        hasVesting: true
    },
    /**
     * Pool name: Team
     * Total allocated token amounts: 1,900,000,000 MTC
     * Vesting: 1,000 days linear
     * Distribution rate: 0.1%
     */
    TEAM_POOL: {
        poolName: "Team",
        distributionRate: 10,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(1_900_000_000)),
        vestingDurationInDays: 1_000,
        hasVesting: true
    },
    /**
     * Pool name: Charity
     * Total allocated token amounts: 100,000,000 MTC
     * Vesting: 1,000 days linear
     * Distribution rate: 0.1%
     */
    CHARITY_POOL: {
        poolName: "Charity",
        distributionRate: 10,
        periodLength: ONE_DAY_IN_SECS,
        lockedAmount: toWei(String(100_000_000)),
        vestingDurationInDays: 1_000,
        hasVesting: true
    }
};

export default POOL_PARAMS;