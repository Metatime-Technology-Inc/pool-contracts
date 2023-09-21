// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../interfaces/IMetaminer.sol";

contract MinerHealthCheck is Initializable {
    enum MinerType {
        Meta,
        Archive,
        Fullnode,
        Light,
        Micro
    }
    IMetaminer public metaminer;
    mapping(address => mapping(MinerType => uint256)) public lastUptime;
    uint256 public timeout;

    // in library we need top of check miner status in metaminer, macrominer, microminer
    modifier isMetaminer() {
        require(
            metaminer.miners(msg.sender).exist == true,
            "Address is not miner."
        );
        _;
    }

    function initialize(
        address metaminerAddress,
        uint256 requiredTimeout
    ) external initializer {
        metaminer = IMetaminer(metaminerAddress);
        timeout = requiredTimeout;
    }

    function ping(MinerType minerType) external isMetaminer returns (bool) {
        lastUptime[msg.sender][minerType] = block.timestamp;
        return true;
    }

    function status(
        address miner,
        MinerType minerType
    ) external view returns (bool) {
        return (
            (lastUptime[miner][minerType] + timeout) >= block.timestamp
                ? true
                : false
        );
    }
}
