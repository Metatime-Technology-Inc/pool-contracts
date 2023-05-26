// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PrivateSaleTokenDistributor is Ownable2Step, ReentrancyGuard {
    IERC20 public token;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public totalAmount;
    mapping (address => uint256) public claimableAmounts;

    event CanClaim(address indexed beneficiary, uint256 amount);
    event HasClaimed(address indexed beneficiary, uint256 amount);
    event Swept(address receiver, uint256 amount);
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount);

    constructor(IERC20 _token, uint256 _startTime, uint256 _endTime) {
        _transferOwnership(_msgSender());

        token = _token;
        startTime = _startTime;
        endTime = _endTime;
    }

    modifier isSettable() {
        require(block.timestamp < startTime, "isSettable: Claim period has already started!");
        _;
    }

    function setClaimableAmounts(address[] calldata users, uint256[] calldata amounts) onlyOwner isSettable external {
        uint256 usersLength = users.length;
        require(usersLength == amounts.length, "setClaimableAmounts: User and amount list lengths must match!");
        
        uint256 totalClaimableAmount = 0;
        for (uint256 i = 0; i < usersLength; ) {
            address user = users[i];

            if (user != address(0)) {
                uint256 amount = amounts[i];
                claimableAmounts[user] = amount;
                emit CanClaim(user, amount);

                totalClaimableAmount = totalClaimableAmount + amount;
            }
            
            unchecked {
                i += 1;
            }
        }

        require(token.balanceOf(address(this)) >= totalClaimableAmount, "Total claimable amount does not match");
        totalAmount = totalClaimableAmount;

        emit SetClaimableAmounts(usersLength, totalClaimableAmount);
    }

    function claim() nonReentrant external {
        require(token.balanceOf(address(this)) > 0, "No tokens to claim in the pool!");
        require(block.timestamp >= startTime, "Tokens cannot be claimed yet");

        uint256 claimableAmount = claimableAmounts[_msgSender()];

        require(claimableAmount > 0, "claim: No tokens to claim!");

        SafeERC20.safeTransfer(token, _msgSender(), claimableAmount);
        claimableAmounts[_msgSender()] = 0;

        emit HasClaimed(_msgSender(), claimableAmount);
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
}