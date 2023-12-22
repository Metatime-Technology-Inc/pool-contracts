// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IAirdropDistributorWithVesting
 * @dev Interface for a airdrop vesting distributor contract
 */
interface IAirdropDistributorWithVesting {
    /**
     * @dev Initializes the TokenDistributor contract.
     * @param _owner The address of the contract owner
     * @param _poolName The name of the token distribution pool
     * @param _distributionPeriodStart The start time of the distribution period
     * @param _distributionPeriodEnd The end time of the distribution period
     * @param _distributionRate The distribution rate (percentage)
     * @param _periodLength The length of each distribution period (in seconds)
     * @param _addressList Address of AddresList contract
     */
    function initialize(
        address _owner,
        string memory _poolName,
        uint256 _distributionPeriodStart,
        uint256 _distributionPeriodEnd,
        uint256 _distributionRate,
        uint256 _periodLength,
        address _addressList
    ) external;
}
