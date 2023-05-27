// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Distributor
 * @notice Holds tokens for users to claim.
 * @dev A contract for distributing tokens over a specified period of time.
 */
contract Distributor is Initializable, Ownable2Step, ReentrancyGuard {
    string public poolName;  // Name of the token distribution pool
    IERC20 public token;  // Token to be distributed
    uint256 public startTime;  // Start time of the distribution
    uint256 public endTime;  // End time of the distribution
    uint256 public periodLength;  // Length of each distribution period
    uint256 public distributionRate;  // Rate of token distribution per period
    uint256 constant public BASE_DIVIDER = 10_000;  // Base divider for distribution rate calculation
    uint256 public claimableAmount;  // Total amount of tokens claimable per period
    uint256 public claimedAmount;  // Total amount of tokens claimed so far
    uint256 public lastClaimTime;  // Timestamp of the last token claim
    uint256 public leftClaimableAmount;  // Remaining amount of tokens available for claiming

    event Swept(address receiver, uint256 amount);  // Event emitted when leftover tokens are swept to the owner
    event CanClaim(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary can claim tokens
    event HasClaimed(address indexed beneficiary, uint256 amount);  // Event emitted when a beneficiary has claimed tokens

    /**
     * @dev Initializes the contract with the specified parameters.
     * @param _owner The address of the contract owner
     * @param _poolName The name of the token distribution pool
     * @param _token The token to be distributed
     * @param _startTime The start time of the distribution
     * @param _endTime The end time of the distribution
     * @param _distributionRate The rate of token distribution per period
     * @param _periodLength The length of each distribution period
     * @param _claimableAmount The total amount of tokens claimable per period
     */
    function initialize(
        address _owner,
        string memory _poolName,
        IERC20 _token,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _distributionRate,
        uint256 _periodLength,
        uint256 _claimableAmount
    ) external initializer {
        require(BASE_DIVIDER / (distributionRate * periodLength) == endTime - startTime, "initialize: Invalid parameters!");
        require(_startTime < _endTime, "Invalid end time");

        _transferOwnership(_owner);

        poolName = _poolName;
        token = _token;
        startTime = _startTime;
        endTime = _endTime;
        distributionRate = _distributionRate;
        periodLength = _periodLength;
        lastClaimTime = startTime;
        claimableAmount = _claimableAmount;
        leftClaimableAmount = _claimableAmount;
    }

    /**
     * @dev Claim tokens for the sender.
     * @return A boolean indicating whether the claim was successful
     */
    function claim() onlyOwner nonReentrant external returns(bool) {
        uint256 amount = calculateClaimableAmount();

        SafeERC20.safeTransfer(token, owner(), amount);

        claimedAmount += amount;

        lastClaimTime = block.timestamp;

        leftClaimableAmount -= amount;

        emit HasClaimed(owner(), amount);

        return true;
    }

    /**
     * @dev Transfer tokens from the contract to a owner address.
     */
    function sweep() onlyOwner external {
        require(block.timestamp > endTime, "sweep: Cannot sweep before claim end time!");

        uint256 leftovers = token.balanceOf(address(this));
        require(leftovers != 0, "TokenDistributor: no leftovers");

        SafeERC20.safeTransfer(token, owner(), leftovers);

        emit Swept(owner(), leftovers);
    }

    /**
     * @dev Calculates the amount of tokens claimable for the current period.
     * @return The amount of tokens claimable for the current period
     */
    function calculateClaimableAmount() public view returns(uint256) {
        require(block.timestamp >= startTime, "Distribution has not started yet");

        uint256 amount = 0;

        if (block.timestamp > endTime) {
            amount = claimableAmount;
        } else {
            require(block.timestamp < endTime, "Distribution has ended");
            amount = _calculateClaimableAmount();
        }

        require(amount > 0, "No tokens to claim");
        require(leftClaimableAmount >= amount, "Not enough tokens left to claim");

        return amount;
    }

    /**
     * @dev Internal function to calculate the amount of tokens claimable for the current period.
     * @return The amount of tokens claimable for the current period
     */
    function _calculateClaimableAmount() internal view returns (uint256) {
        uint256 initialAmount = claimableAmount;
        uint256 periodSinceLastClaim = ((block.timestamp - lastClaimTime) * 10 ** 18) / periodLength;

        return (((initialAmount * distributionRate) / BASE_DIVIDER) * periodSinceLastClaim) / 10 ** 18;
    }
}