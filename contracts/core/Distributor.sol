// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Distributor is Initializable, Ownable2Step, ReentrancyGuard {
    string public poolName;
    IERC20 public token;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public periodLength;
    uint256 public distributionRate;
    uint256 constant public BASE_DIVIDER = 10_000;
    uint256 public claimableAmount;
    uint256 public claimedAmount;
    uint256 public lastClaimTime;
    uint256 public leftClaimableAmount;

    event Swept(address receiver, uint256 amount);
    event CanClaim(address indexed beneficiary, uint256 amount);
    event HasClaimed(address indexed beneficiary, uint256 amount);

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
     * @dev Calculate the amount of tokens that can be claimed by a caller address
     * based on the number of days that have passed since the last claim.
     * The daily claim percentage is 0.4% of the initial claimable amount.
     */
    function _calculateClaimableAmount() internal view returns (uint256) {
        uint256 initialAmount = claimableAmount;
        uint256 periodSinceLastClaim = ((block.timestamp - lastClaimTime) * 10 ** 18) / periodLength;

        return (((initialAmount * distributionRate) / BASE_DIVIDER) * periodSinceLastClaim) / 10 ** 18;
    }
}