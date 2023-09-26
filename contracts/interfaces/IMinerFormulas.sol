// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IMinerFormulas {
    function calculateMetaminerReward() external view returns (uint256);
}
