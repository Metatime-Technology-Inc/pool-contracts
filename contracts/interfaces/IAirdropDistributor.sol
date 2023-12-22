// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IAirdropDistributor
 * @dev Interface for a airdrop distributor contract
 */
interface IAirdropDistributor {
    /**
     * @dev Initializes the contract.
     * @param _owner The address of the contract owner.
     * @param _poolName The name of the airdrop distribution pool
     * @param _distributionPeriodStart The start time of the claim period
     * @param _distributionPeriodEnd The end time of the claim period
     * @param _addressList Address of AddresList contract
     */
    function initialize(
        address _owner,
        string memory _poolName,
        uint256 _distributionPeriodStart,
        uint256 _distributionPeriodEnd,
        address _addressList
    ) external;
}
