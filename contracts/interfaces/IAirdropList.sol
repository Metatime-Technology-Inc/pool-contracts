// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IAirdropList {
    function userList(
        uint256 userID
    ) external view returns (address walletAddress);

    function addressList(
        address walletAddress
    ) external view returns (uint256 userID);
}
