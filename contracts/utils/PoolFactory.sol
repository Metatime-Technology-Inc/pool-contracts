// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "../interfaces/IDistributor.sol";
import "../interfaces/ITokenDistributor.sol";

/**
 * @title PoolFactory
 * @dev A contract for creating Distributor and TokenDistributor contracts.
 */
contract PoolFactory is Ownable2Step {
    uint256 public distributorCount; // Counter for the number of created Distributor contracts.
    uint256 public tokenDistributorCount; // Counter for the number of created TokenDistributor contracts.
    bool public initialized = false;

    mapping(uint256 => address) private _distributors; // Mapping to store Distributor contract addresses by their IDs.
    mapping(uint256 => address) private _tokenDistributors; // Mapping to store TokenDistributor contract addresses by their IDs.

    address public distributorImplementation; // Address of the implementation contract for Distributor contracts.
    address public tokenDistributorImplementation; // Address of the implementation contract for TokenDistributor contracts.

    event DistributorCreated(
        address creatorAddress,
        address distributorAddress,
        uint256 distributorId
    ); // Event emitted when a Distributor contract is created.
    event TokenDistributorCreated(
        address creatorAddress,
        address tokenDistributorAddress,
        uint256 tokenDistributorId
    ); // Event emitted when a TokenDistributor contract is created.

    /**
     * @dev Initializes the contract with new implementation addresses.
     */
    function initialize(
        address distributorAddress,
        address tokenDistributorAddress
    ) external {
        require(
            initialized == false,
            "PoolFactory: contract has initialized before"
        );
        require(
            distributorAddress != address(0) &&
                tokenDistributorAddress != address(0),
            "PoolFactory: invalid adress types"
        );
        _transferOwnership(_msgSender());
        distributorImplementation = distributorAddress;
        tokenDistributorImplementation = tokenDistributorAddress;

        initialized = true;
    }

    /**
     * @dev Returns the address of a Distributor contract based on the distributor ID.
     * @param distributorId The ID of the Distributor contract.
     * @return The address of the Distributor contract.
     */
    function getDistributor(
        uint256 distributorId
    ) external view returns (address) {
        return _distributors[distributorId];
    }

    /**
     * @dev Returns the address of a TokenDistributor contract based on the tokenDistributor ID.
     * @param tokenDistributorId The ID of the TokenDistributor contract.
     * @return The address of the TokenDistributor contract.
     */
    function getTokenDistributor(
        uint256 tokenDistributorId
    ) external view returns (address) {
        return _tokenDistributors[tokenDistributorId];
    }

    /**
     * @dev Creates a new Distributor contract.
     * @param poolName The name of the pool.
     * @param startTime The start time of the distribution.
     * @param endTime The end time of the distribution.
     * @param distributionRate The distribution rate.
     * @param periodLength The length of each distribution period.
     * @param claimableAmount The total amount claimable per period.
     * @return The ID of the created Distributor contract.
     */
    function createDistributor(
        string memory poolName,
        uint256 startTime,
        uint256 endTime,
        uint256 distributionRate,
        uint256 periodLength,
        uint256 lastClaimTime,
        uint256 claimableAmount,
        uint256 leftClaimableAmount
    ) external onlyOwner returns (uint256) {
        address newDistributorAddress = Clones.clone(distributorImplementation);
        IDistributor newDistributor = IDistributor(newDistributorAddress);
        newDistributor.initialize(
            owner(),
            poolName,
            startTime,
            endTime,
            distributionRate,
            periodLength,
            lastClaimTime,
            claimableAmount,
            leftClaimableAmount
        );

        emit DistributorCreated(
            owner(),
            newDistributorAddress,
            distributorCount
        );

        return _addNewDistributor(newDistributorAddress);
    }

    /**
     * @dev Creates a new TokenDistributor contract.
     * @param poolName The name of the pool.
     * @param startTime The start time of the distribution.
     * @param endTime The end time of the distribution.
     * @param distributionRate The distribution rate.
     * @param periodLength The length of each distribution period.
     * @return The ID of the created TokenDistributor contract.
     */
    function createTokenDistributor(
        string memory poolName,
        uint256 startTime,
        uint256 endTime,
        uint256 distributionRate,
        uint256 periodLength
    ) external onlyOwner returns (uint256) {
        address newTokenDistributorAddress = Clones.clone(
            tokenDistributorImplementation
        );
        ITokenDistributor newTokenDistributor = ITokenDistributor(
            newTokenDistributorAddress
        );
        newTokenDistributor.initialize(
            owner(),
            poolName,
            startTime,
            endTime,
            distributionRate,
            periodLength
        );

        emit TokenDistributorCreated(
            owner(),
            newTokenDistributorAddress,
            tokenDistributorCount
        );

        return _addNewTokenDistributor(newTokenDistributorAddress);
    }

    /**
     * @dev Internal function to add a new Distributor contract address to the mapping.
     * @param _newDistributorAddress The address of the new Distributor contract.
     * @return The ID of the added Distributor contract.
     */
    function _addNewDistributor(
        address _newDistributorAddress
    ) internal returns (uint256) {
        _distributors[distributorCount] = _newDistributorAddress;
        distributorCount++;

        return distributorCount - 1;
    }

    /**
     * @dev Internal function to add a new TokenDistributor contract address to the mapping.
     * @param _newDistributorAddress The address of the new TokenDistributor contract.
     * @return The ID of the added TokenDistributor contract.
     */
    function _addNewTokenDistributor(
        address _newDistributorAddress
    ) internal returns (uint256) {
        _tokenDistributors[tokenDistributorCount] = _newDistributorAddress;
        tokenDistributorCount++;

        return tokenDistributorCount - 1;
    }
}
