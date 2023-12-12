// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TokenDistributor2
 * @dev A contract for distributing tokens during no vesting sales.
 */
contract TokenDistributor2 is Ownable2Step {
    IERC20 public immutable token; // The token being distributed
    uint256 public distributionPeriodStart; // The start time of the distribution period
    uint256 public distributionPeriodEnd; // The end time of the distribution period
    uint256 public claimPeriodEnd; // The end time of the claim period
    uint256 public totalAmount; // The total amount of tokens available for distribution
    mapping(address => uint256) public claimableAmounts; // Mapping of beneficiary addresses to their claimable amounts

    event CanClaim(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary can claim tokens
    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary claims tokens
    event Swept(address receiver, uint256 amount); // Event emitted when tokens are swept from the contract
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount); // Event emitted when claimable amounts are set

    /**
     * @dev Constructor.
     * @param _token The token being distributed
     * @param _distributionPeriodStart The start time of the claim period
     * @param _distributionPeriodEnd The end time of the claim period
     */
    constructor(
        IERC20 _token,
        uint256 _distributionPeriodStart,
        uint256 _distributionPeriodEnd
    ) {
        require(
            address(_token) != address(0),
            "TokenDistributor2: invalid token address"
        );
        require(
            _distributionPeriodEnd > _distributionPeriodStart,
            "TokenDistributor2: end time must be bigger than start time"
        );

        token = _token;
        distributionPeriodStart = _distributionPeriodStart;
        distributionPeriodEnd = _distributionPeriodEnd;
        claimPeriodEnd = _distributionPeriodEnd + 100 days;
    }

    /**
     * @dev Controls settable status of the contract while trying to set addresses and their amounts.
     */
    modifier isSettable() {
        require(
            block.timestamp < distributionPeriodStart,
            "TokenDistributor2: claim period has already started"
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
            "TokenDistributor2: user and amount list lengths must match"
        );

        uint256 sum = totalAmount;
        for (uint256 i = 0; i < usersLength; i++) {
            address user = users[i];

            require(
                user != address(0),
                "TokenDistributor2: cannot set zero address"
            );

            uint256 amount = amounts[i];

            require(
                claimableAmounts[user] == 0,
                "TokenDistributor2: address already set"
            );

            claimableAmounts[user] = amount;
            emit CanClaim(user, amount);

            sum += amounts[i];
        }

        require(
            token.balanceOf(address(this)) >= sum,
            "TokenDistributor2: total claimable amount does not match"
        );
        totalAmount = sum;

        emit SetClaimableAmounts(usersLength, totalAmount);
    }

    /**
     * @dev Allows a beneficiary to claim their tokens.
     */
    function claim() external {
        require(
            block.timestamp >= distributionPeriodStart,
            "TokenDistributor2: tokens cannot be claimed yet"
        );
        require(
            block.timestamp <= claimPeriodEnd,
            "TokenDistributor2: claim period has ended"
        );

        uint256 claimableAmount = claimableAmounts[_msgSender()];

        require(claimableAmount > 0, "TokenDistributor2: no tokens to claim");

        claimableAmounts[_msgSender()] = 0;

        SafeERC20.safeTransfer(token, _msgSender(), claimableAmount);

        emit HasClaimed(_msgSender(), claimableAmount);
    }

    /**
     * @dev Transfers remaining tokens from the contract to the owner.
     */
    function sweep() external onlyOwner {
        require(
            block.timestamp > claimPeriodEnd,
            "TokenDistributor2: cannot sweep before claim end time"
        );

        uint256 leftovers = token.balanceOf(address(this));
        require(leftovers != 0, "TokenDistributor2: no leftovers");

        SafeERC20.safeTransfer(token, owner(), leftovers);

        emit Swept(owner(), leftovers);
    }
}
