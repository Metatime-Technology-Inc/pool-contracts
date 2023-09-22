// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../libs/MinerTypes.sol";
import "../interfaces/IMetaminer.sol";

contract MinerHealthCheck is Initializable {
    IMetaminer public metaminer;
    mapping(address => mapping(MinerTypes.NodeType => uint256))
        public lastUptime;
    uint256 public timeout;

    // in library we need top of check miner status in metaminer, macrominer, microminer
    modifier isMetaminer(MinerTypes.NodeType _type) {
        bool isMetaminer = metaminer.miners(msg.sender).exist;
        bool isMacrominer = metaminer.miners(msg.sender).exist;
        bool isMicrominer = metaminer.miners(msg.sender).exist;
        bool result = isMetaminer
            ? true
            : (isMacrominer ? true : (isMicrominer ? true : false));
        require(result == true, "Address is not miner.");
        _;
    }

    function initialize(
        address metaminerAddress,
        uint256 requiredTimeout
    ) external initializer {
        metaminer = IMetaminer(metaminerAddress);
        timeout = requiredTimeout;
    }

    function ping(
        MinerTypes.NodeType minerType
    ) external isMetaminer(minerType) returns (bool) {
        lastUptime[msg.sender][minerType] = block.timestamp;
        // active time on day
        // 100_000 node, tx sayısı block a giren
        // - block basan metaminer tx atıyor
        // - block history archiveNode tx atıyor
        // -- -- block geldi -> block check on contract if not exist send tx
        // -- total: 2
        if (minerType == MinerTypes.NodeType.Meta) {
            // meta
        } else if (minerType == MinerTypes.NodeType.Micro) {
            // macro
        } else {
            // micro
        }

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
}
