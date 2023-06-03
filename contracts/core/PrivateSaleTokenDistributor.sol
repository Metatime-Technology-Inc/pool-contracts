// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PrivateSaleTokenDistributor
 * @dev A contract for distributing tokens during a private sale.
 */
contract PrivateSaleTokenDistributor is Ownable2Step, ReentrancyGuard {
    IERC20 public token; // The token being distributed
    uint256 public startTime; // The start time of the claim period
    uint256 public endTime; // The end time of the claim period
    uint256 public totalAmount; // The total amount of tokens available for distribution
    mapping(address => uint256) public claimableAmounts; // Mapping of beneficiary addresses to their claimable amounts

    event CanClaim(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary can claim tokens
    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary claims tokens
    event Swept(address receiver, uint256 amount); // Event emitted when tokens are swept from the contract
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount); // Event emitted when claimable amounts are set

    /**
     * @dev Constructor.
     * @param _token The token being distributed
     * @param _startTime The start time of the claim period
     * @param _endTime The end time of the claim period
     */
    constructor(IERC20 _token, uint256 _startTime, uint256 _endTime) {
        _transferOwnership(_msgSender());

        token = _token;
        startTime = _startTime;
        endTime = _endTime;
    }

    /**
     * @dev Controls settable status of contract while trying to set addresses and their amounts.
     */
    modifier isSettable() {
        require(
            block.timestamp < startTime,
            "isSettable: Claim period has already started"
        );
        _;
    }

    /**
     * @dev Sets the claimable amounts for a list of users.
     * @param users The list of user addresses
     * @param amounts The list of claimable amounts corresponding to each user
     */
    function setClaimableAmounts(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyOwner isSettable {
        uint256 usersLength = users.length;
        require(
            usersLength == amounts.length,
            "setClaimableAmounts: User and amount list lengths must match"
        );

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

        require(
            token.balanceOf(address(this)) >= totalClaimableAmount,
            "setClaimableAmounts: Total claimable amount does not match"
        );
        totalAmount = totalClaimableAmount;

        emit SetClaimableAmounts(usersLength, totalClaimableAmount);
    }

    /**
     * @dev Allows a beneficiary to claim their tokens.
     */
    function claim() external nonReentrant {
        require(
            token.balanceOf(address(this)) > 0,
            "No tokens to claim in the pool"
        );
        require(
            block.timestamp >= startTime,
            "claim: Tokens cannot be claimed yet"
        );

        uint256 claimableAmount = claimableAmounts[_msgSender()];

        require(claimableAmount > 0, "claim: No tokens to claim");

        SafeERC20.safeTransfer(token, _msgSender(), claimableAmount);
        claimableAmounts[_msgSender()] = 0;

        emit HasClaimed(_msgSender(), claimableAmount);
    }

    /**
     * @dev Transfers remaining tokens from the contract to the owner.
     */
    function sweep() external onlyOwner {
        require(
            block.timestamp > endTime,
            "sweep: Cannot sweep before claim end time"
        );

        uint256 leftovers = token.balanceOf(address(this));
        require(leftovers != 0, "sweep: No leftovers");

        SafeERC20.safeTransfer(token, owner(), leftovers);

        emit Swept(owner(), leftovers);
    }
}
