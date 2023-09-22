// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "../interfaces/IMetaPoints.sol";
import "../interfaces/IMetaminer.sol";
import "../interfaces/IMacrominer.sol";
import "../interfaces/IMicrominer.sol";

library MinerFormulas {
    enum PoolType {
        Reward,
        Mining
    }

    IMetaPoints public constant METAPOINTS =
        IMetaPoints(0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5);
    IMetaminer public constant METAMINER =
        IMetaminer(0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5);
    IMacrominer public constant MACROMINER =
        IMacrominer(0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5);
    IMicrominer public constant MICROMINER =
        IMicrominer(0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5);

    uint256 public constant METAMINER_DAILY_BLOCK_COUNT = 17_280;
    uint256 public constant METAMINER_DAILY_PRIZE_POOL = 166_666;
    uint256 public constant METAMINER_DAILY_PRIZE_LIMIT = 450 * 10 ** 18;

    uint256 public constant MACROMINER_ARCHIVE_DAILY_MAX_REWARD = 150;
    uint256 public constant MACROMINER_FULLNODE_DAILY_MAX_REWARD = 100;
    uint256 public constant MACROMINER_LIGHT_DAILY_MAX_REWARD = 50;

    uint256 public constant MACROMINER_ARCHIVE_DAILY_PRIZE_POOL_REWARD = 75_000;
    uint256 public constant MACROMINER_ARCHIVE_DAILY_CALC_POOL_REWARD = 60_000;

    uint256 public constant MACROMINER_FULLNODE_DAILY_PRIZE_POOL_REWARD =
        50_000;
    uint256 public constant MACROMINER_FULLNODE_DAILY_CALC_POOL_REWARD = 40_000;

    uint256 public constant MACROMINER_LIGHT_DAILY_PRIZE_POOL_REWARD = 25_000;
    uint256 public constant MACROMINER_LIGHT_DAILY_CALC_POOL_REWARD = 40_000;

    function calculateMetaminerReward(
        uint256 metaminerCount
    ) external pure returns (uint256) {
        uint256 calculatedAmount = ((METAMINER_DAILY_PRIZE_POOL * 10 ** 18) /
            metaminerCount);
        return
            calculatedAmount > METAMINER_DAILY_PRIZE_LIMIT
                ? METAMINER_DAILY_PRIZE_LIMIT / METAMINER_DAILY_BLOCK_COUNT
                : calculatedAmount /
                    (METAMINER_DAILY_BLOCK_COUNT / metaminerCount);
    }

    // macrominers get rewards from reward pool and miner pool
    function calculateMacrominerArchiveReward(
        address minerAddress,
        PoolType poolType
    ) external view returns (uint256) {
        if (poolType == PoolType.Reward) {
            uint256 MP = _balaceOfMP(minerAddress);
            uint256 TMP = _totalSupplyMP();
            uint256 TN = _totalNodeCount();
            //
            return (0);
        } else if (poolType == PoolType.Mining) {
            uint256 formula = (MACROMINER_ARCHIVE_DAILY_CALC_POOL_REWARD /
                (24 * _totalNodeCount()));
            return (
                formula >= MACROMINER_ARCHIVE_DAILY_MAX_REWARD
                    ? MACROMINER_ARCHIVE_DAILY_MAX_REWARD
                    : formula
            );
        }

        return (0);
    }

    function calculateMacrominerFullReward(
        address minerAddress,
        PoolType poolType
    ) external view returns (uint256) {
        if (poolType == PoolType.Reward) {
            uint256 MP = _balaceOfMP(minerAddress);
            uint256 TMP = _totalSupplyMP();
            uint256 TN = _totalNodeCount();
            //
            return (0);
        } else if (poolType == PoolType.Mining) {
            uint256 formula = (MACROMINER_FULLNODE_DAILY_CALC_POOL_REWARD /
                (24 * _totalNodeCount()));
            return (
                formula >= MACROMINER_FULLNODE_DAILY_MAX_REWARD
                    ? MACROMINER_FULLNODE_DAILY_MAX_REWARD
                    : formula
            );
        }

        return (0);
    }

    function calculateMacrominerLightReward(
        address minerAddress,
        PoolType poolType
    ) external view returns (uint256) {
        if (poolType == PoolType.Reward) {
            uint256 MP = _balaceOfMP(minerAddress);
            uint256 TMP = _totalSupplyMP();
            uint256 TN = _totalNodeCount();
            //
            return (0);
        } else if (poolType == PoolType.Mining) {
            uint256 formula = (MACROMINER_LIGHT_DAILY_CALC_POOL_REWARD /
                (24 * _totalNodeCount()));
            return (
                formula >= MACROMINER_LIGHT_DAILY_MAX_REWARD
                    ? MACROMINER_LIGHT_DAILY_MAX_REWARD
                    : formula
            );
        }

        return (0);
    }

    function totalNodeCount() external view returns (uint256) {
        return (_totalNodeCount());
    }

    function _totalNodeCount() internal view returns (uint256) {
        uint256 metaminerCount = METAMINER.minerCount();

        uint256 archiveCount = MACROMINER.archiveCount();
        uint256 fullnodeCount = MACROMINER.fullnodeCount();
        uint256 lightCount = MACROMINER.lightCount();

        uint256 macrominerCount = archiveCount + fullnodeCount + lightCount;

        uint256 microminerCount = MICROMINER.minerCount();
        return (metaminerCount + macrominerCount + microminerCount);
    }

    function _balaceOfMP(address miner) internal view returns (uint256) {
        return (METAPOINTS.balanceOf(miner));
    }

    function _totalSupplyMP() internal view returns (uint256) {
        return (METAPOINTS.totalSupply());
    }

    // in whitepaper there is not some kind reward to microminers, just they are get reward from macrominer vote
    // function calculateMicrominerReward() {

    // }
}
