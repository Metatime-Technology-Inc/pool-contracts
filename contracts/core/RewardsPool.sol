// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "../interfaces/IMetaminer.sol";

/**
 * @title RewardsPool
 * @notice Holds tokens for miners to claim.
 * @dev A contract for distributing tokens over a specified period of time for mining purposes.
 */
contract RewardsPool is Initializable, Ownable2Step {
    string public poolName; // Name of the mtc distribution pool
    IMetaminer public constant METAMINER = IMetaminer(0x0000000000000000000000000000000000002006);
    uint256 public constant DAILY_BLOCK_COUNT = 17_280;
    uint256 public constant DAILY_PRIZE_POOL = 166_666;
    mapping(address => uint256) public claimedAmounts; // Total amount of tokens claimed so far
    mapping(address => bool) public managers; // Managers of the contract

    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary has claimed tokens
    event Deposit(address indexed sender, uint amount, uint balance); // Event emitted when pool received mtc

    /**
     * @dev Checks manager address.
     */
    modifier onlyManager() {
        require(
            managers[_msgSender()] == true,
            "RewardsPool: address is not manager"
        );
        _;
    }

    /**
     * @dev Initializes the contract with the specified parameters.
     * @param _owner The address of the contract owner.
     * @param _poolName The name of the mtc distribution pool.
     */
    function initialize(
        address _owner,
        string memory _poolName
    )
        external
        initializer
    {
        _transferOwnership(_owner);

        poolName = _poolName;
    }

    /**
     * @dev Sets new manager addresses.
     * @return A boolean indicating whether the address setting was successful.
     */
    function setManagers(address[] memory newManagers) onlyOwner external returns (bool) {
        uint256 i = 0;
        uint256 newManagersLength = newManagers.length;
        for (i; i < newManagersLength; i++) {
            address newManagerAddress = newManagers[i];
            managers[newManagerAddress] = true;
        }

        return true;
    }

    /**
     * @dev Claim tokens for the sender.
     * @return A boolean indicating whether the claim was successful.
     */
    function claim(address receiver) external onlyManager returns (uint256) {
        require(METAMINER.miners(receiver).exist == true, "RewardsPool: receiver is not miner");
        uint256 amount = calculateClaimableAmount();

        claimedAmounts[receiver] += amount;

        (bool sent, ) = receiver.call{value: amount}("");
        require(sent, "RewardsPool: unable to claim");

        emit HasClaimed(owner(), amount);

        return amount;
    }

    /**
     * @dev Calculates the amount of tokens claimable for the current period.
     * @return The amount of tokens claimable for the current period.
     */
    function calculateClaimableAmount() public returns (uint256) {
        return _calculateClaimableAmount();
    }

    /**
     * @dev Internal function to calculate the amount of tokens claimable for the current period.
     * @return The amount of tokens claimable for the current period.
     */
    function _calculateClaimableAmount() internal returns (uint256) {
        uint256 metaminerCount = METAMINER.minerCount();

        uint256 calculatedAmount = ((DAILY_PRIZE_POOL * 10 ** 18) / metaminerCount) / 10 ** 18;
        uint256 amount = calculatedAmount > 450 ? 450 : calculatedAmount;
        uint256 dailyMinedBlockCount = DAILY_BLOCK_COUNT / metaminerCount;
        
        return amount / dailyMinedBlockCount;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
}
