// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IMinerFormulas {
    function calculateMetaminerReward(
        uint256 metaminerCount
    ) external pure returns (uint256);
}
