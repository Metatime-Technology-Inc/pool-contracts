// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "../libs/MinerTypes.sol";

interface IMinerHealthCheck {
    function status(
        address minerAddress,
        MinerTypes.NodeType miner
    ) external view returns (bool);
}
