// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenDistributor is Initializable, Ownable2Step, ReentrancyGuard {
    string public poolName;
    IERC20 public token;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public periodLength;
    uint256 public distributionRate;
    uint256 constant public BASE_DIVIDER = 10_000;
    mapping(address => uint256) public claimableAmounts;
    mapping(address => uint256) public claimedAmounts;
    mapping(address => uint256) public lastClaimTimes;
    mapping(address => uint256) public leftClaimableAmounts;

    event Swept(address receiver, uint256 amount);
    event CanClaim(address indexed beneficiary, uint256 amount);
    event HasClaimed(address indexed beneficiary, uint256 amount);
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount);

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
     * @dev Set the claimable amount for each address.
     * @param users List of addresses to set claimable amounts for.
     * @param amounts List of claimable amounts for each address.
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
     * @dev Claim tokens for the sender.
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
    * @dev Transfer tokens from the contract to owner address.
    */
    function sweep() onlyOwner external {
        require(block.timestamp > endTime, "sweep: Cannot sweep before claim end time!");

        uint256 leftovers = token.balanceOf(address(this));
        require(leftovers != 0, "TokenDistributor: no leftovers");

        SafeERC20.safeTransfer(token, owner(), leftovers);

        emit Swept(owner(), leftovers);
    }

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
     * @dev Calculate the amount of tokens that can be claimed by a given address
     * based on the number of days that have passed since the last claim.
     * The daily claim percentage is 0.4% of the initial claimable amount.
     */
    function _calculateClaimableAmount(address user) internal view returns (uint256) {
        uint256 initialAmount = claimableAmounts[user];
        uint256 periodSinceLastClaim = ((block.timestamp - lastClaimTimes[user]) * 10 ** 18) / periodLength;
        
        return (((initialAmount * distributionRate) / BASE_DIVIDER) * periodSinceLastClaim) / 10 ** 18;
    }
}