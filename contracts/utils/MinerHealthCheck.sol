// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../libs/MinerTypes.sol";
import "../interfaces/IMinerList.sol";
import "../interfaces/IMinerFormulas.sol";

contract MinerHealthCheck is Initializable {
    IMinerList public minerList;
    IMinerFormulas public minerFormulas;
    mapping(address => mapping(MinerTypes.NodeType => uint256))
        public lastUptime;
    mapping(uint256 => mapping(MinerTypes.NodeType => uint256))
        public dailyNodesActivities; // TA
    mapping(uint256 => mapping(address => mapping(MinerTypes.NodeType => uint256)))
        public dailyNodeActivity; // A
    mapping(uint256 => mapping(MinerTypes.NodeType => uint256))
        public totalRewardsFromFirstFormula;
    mapping(uint256 => mapping(MinerTypes.NodeType => uint256))
        public totalRewardsFromSecondFormula;
    uint256 public timeout;

    modifier isMiner(address miner, MinerTypes.NodeType nodeType) {
        require(minerList.isMiner(miner, nodeType), "Address is not miner.");
        _;
    }

    function initialize(
        address minerListAddress,
        address minerFormulasAddress,
        uint256 requiredTimeout
    ) external initializer {
        minerList = IMinerList(minerListAddress);
        minerFormulas = IMinerFormulas(minerFormulasAddress);
        timeout = requiredTimeout;
    }

    function ping(
        MinerTypes.NodeType nodeType
    ) external isMiner(msg.sender, nodeType) returns (bool) {
        // active time on day
        // 1000 node, tx sayısı block a giren
        // - block basan metaminer tx atıyor
        // - block history archiveNode tx atıyor
        // -- -- block geldi -> block check on contract if not exist send tx
        // -- total: 2
        uint256 lastSeen = lastUptime[msg.sender][nodeType];
        uint256 maxLimit = lastSeen + timeout;

        if (maxLimit >= block.timestamp) {
            uint256 activityTime = block.timestamp - lastSeen;
            _incrementDailyActiveTimes(msg.sender, nodeType, activityTime);
            _incrementDailyTotalActiveTimes(nodeType, activityTime);
            _claimRewards(msg.sender, nodeType, activityTime);
        }

        lastUptime[msg.sender][nodeType] = block.timestamp;
        return true;
    }

    function status(
        address minerAddress,
        MinerTypes.NodeType minerType
    ) external view returns (bool) {
        return (
            (lastUptime[minerAddress][minerType] + timeout) >= block.timestamp
                ? true
                : false
        );
    }

    function setTimeout(uint256 newTimeout) external returns (bool) {
        timeout = newTimeout;
        return (true);
    }

    function _claimRewards(
        address minerAddress,
        MinerTypes.NodeType nodeType,
        uint256 activityTime
    ) internal returns (bool) {
        // for only macrominers
        // activityTime is multiplier

        // calculateDailyOnePoolReward -> hard cap example -> MACROMINER_ARCHIVE_DAILY_CALC_ONE_POOL_REWARD
        // calculateDailyTwoPoolReward -> hard cap example -> MACROMINER_ARCHIVE_DAILY_CALC_TWO_POOL_REWARD

        // claim from miner pool for both first formula and second formula, then add returned amount to for both totalRewards mapping
        // mint (1 / 24 hours MetaPoints) * activityTime

        return (true);
    }

    function _incrementDailyTotalActiveTimes(
        MinerTypes.NodeType nodeType,
        uint256 activityTime
    ) internal returns (bool) {
        dailyNodesActivities[minerFormulas.getDate()][nodeType] += activityTime;
        return (true);
    }

    function _incrementDailyActiveTimes(
        address minerAddress,
        MinerTypes.NodeType nodeType,
        uint256 activityTime
    ) internal returns (bool) {
        dailyNodeActivity[minerFormulas.getDate()][minerAddress][
            nodeType
        ] += activityTime;
        return (true);
    }

    // function _incrementTotalReward(MinerTypes.NodeType nodeType, uint256 activityTime) internal returns (bool) {
    //     totalRewards[_getDate()][nodeType] += activityTime;
    //     return (true);
    // }
}
