// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IMinerHealthCheck {
    enum MinerType {
        Meta,
        Archive,
        Fullnode,
        Light,
        Micro
    }

    function status(
        address miner,
        MinerType minerType
    ) external view returns (bool);
}
