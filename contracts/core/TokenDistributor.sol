// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenDistributor
 * @dev A contract for distributing tokens among users over a specific period of time.
 */
contract TokenDistributor is Initializable, Ownable2Step, ReentrancyGuard {
    string public poolName; // The name of the token distribution pool
    IERC20 public token; // The ERC20 token being distributed
    uint256 public startTime; // The start time of the distribution period
    uint256 public endTime; // The end time of the distribution period
    uint256 public periodLength; // The length of each distribution period (in seconds)
    uint256 public distributionRate; // The distribution rate (percentage)
    uint256 constant public BASE_DIVIDER = 10_000; // The base divider used for calculations
    mapping(address => uint256) public claimableAmounts; // Mapping of user addresses to their claimable amounts
    mapping(address => uint256) public claimedAmounts; // Mapping of user addresses to their claimed amounts
    mapping(address => uint256) public lastClaimTimes; // Mapping of user addresses to their last claim times
    mapping(address => uint256) public leftClaimableAmounts; // Mapping of user addresses to their remaining claimable amounts

    event Swept(address receiver, uint256 amount); // Event emitted when the contract owner sweeps remaining tokens
    event CanClaim(address indexed beneficiary, uint256 amount); // Event emitted when a user can claim tokens
    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a user has claimed tokens
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount); // Event emitted when claimable amounts are set

    /**
     * @dev Initializes the TokenDistributor contract.
     * @param _owner The address of the contract owner
     * @param _poolName The name of the token distribution pool
     * @param _token The ERC20 token being distributed
     * @param _startTime The start time of the distribution period
     * @param _endTime The end time of the distribution period
     * @param _distributionRate The distribution rate (percentage)
     * @param _period The length of each distribution period (in seconds)
     */
    function initialize(
        address _owner,
        string memory _poolName,
        IERC20 _token,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _distributionRate,
        uint256 _period
    ) external initializer {
        require(BASE_DIVIDER / (distributionRate * periodLength) == endTime - startTime, "initialize: Invalid parameters!");
        require(_startTime < _endTime, "Invalid end time");

        _transferOwnership(_owner);

        poolName = _poolName;
        token = _token;
        startTime = _startTime;
        endTime = _endTime;
        distributionRate = _distributionRate;
        periodLength = _period;
    }

    modifier isSettable() {
        require(block.timestamp < startTime, "isSettable: Claim periodLength has started!");
        _;
    }

    /**
     * @dev Sets the claimable amounts for a list of users.
     * Only the owner can call this function before the claim period starts.
     * @param users An array of user addresses
     * @param amounts An array of claimable amounts corresponding to each user
     */
    function setClaimableAmounts(address[] calldata users, uint256[] calldata amounts) onlyOwner isSettable external {
        uint256 usersLength = users.length;
        require(usersLength == amounts.length, "setClaimableAmounts: User and amount list lengths must match!");
        
        uint256 totalClaimableAmount = 0;
        for (uint256 i = 0; i < usersLength; ) {
            address user = users[i];

            if (user != address(0)) {
                uint256 amount = amounts[i];
                claimableAmounts[user] = amount;
                leftClaimableAmounts[user] = amount;
                lastClaimTimes[user] = startTime;
                emit CanClaim(user, amount);

                totalClaimableAmount = totalClaimableAmount + amount;
            }
            
            unchecked {
                i += 1;
            }
        }

        require(token.balanceOf(address(this)) >= totalClaimableAmount, "Total claimable amount does not match");
        emit SetClaimableAmounts(usersLength, totalClaimableAmount);
    }

    /**
     * @dev Allows a user to claim their available tokens.
     * Tokens can only be claimed during the distribution period.
     */
    function claim() nonReentrant external returns(bool) {
        address sender = _msgSender();
        uint256 claimableAmount = calculateClaimableAmount(sender);

        SafeERC20.safeTransfer(token, sender, claimableAmount);
        claimedAmounts[sender] = claimedAmounts[sender] + claimableAmount;

        lastClaimTimes[sender] = block.timestamp;

        leftClaimableAmounts[sender] = leftClaimableAmounts[sender] - claimableAmount;

        emit HasClaimed(sender, claimableAmount);

        return true;
    }

    /**
     * @dev Allows the contract owner to sweep any remaining tokens after the claim period ends.
     * Tokens are transferred to the contract owner's address.
     */
    function sweep() onlyOwner external {
        require(block.timestamp > endTime, "sweep: Cannot sweep before claim end time!");

        uint256 leftovers = token.balanceOf(address(this));
        require(leftovers != 0, "TokenDistributor: no leftovers");

        SafeERC20.safeTransfer(token, owner(), leftovers);

        emit Swept(owner(), leftovers);
    }

    /**
     * @dev Calculates the claimable amount of tokens for a given user.
     * The claimable amount depends on the number of days that have passed since the last claim.
     * @param user The address of the user
     * @return The claimable amount of tokens for the user
     */
    function calculateClaimableAmount(address user) public view returns(uint256) {
        require(block.timestamp >= startTime, "Distribution has not started yet");

        uint256 claimableAmount = 0;

        if (block.timestamp > endTime) {
            claimableAmount = claimableAmounts[user];
        } else {
            require(block.timestamp < endTime, "Distribution has ended");
            claimableAmount = _calculateClaimableAmount(user);
        }

        require(claimableAmount > 0, "No tokens to claim");
        require(leftClaimableAmounts[user] >= claimableAmount, "Not enough tokens left to claim");

        return claimableAmount;
    }

    /**
     * @dev Calculates the amount of tokens that can be claimed by a given address
     * based on the number of days that have passed since the last claim.
     * @param user The address of the user
     * @return The amount of tokens that can be claimed by the user
     */
    function _calculateClaimableAmount(address user) internal view returns (uint256) {
        uint256 initialAmount = claimableAmounts[user];
        uint256 periodSinceLastClaim = ((block.timestamp - lastClaimTimes[user]) * 10 ** 18) / periodLength;
        
        return (((initialAmount * distributionRate) / BASE_DIVIDER) * periodSinceLastClaim) / 10 ** 18;
    }
}