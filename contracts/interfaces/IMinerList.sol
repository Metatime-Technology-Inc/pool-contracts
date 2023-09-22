// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "../libs/MinerTypes.sol";

interface IMinerList {
    function isMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) external view returns (bool);

    function addMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) external returns (bool);

    function deleteMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) external returns (bool);
}
