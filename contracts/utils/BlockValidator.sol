// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "../interfaces/IRewardsPool.sol";

contract BlockValidator is Context, Initializable {
    uint256[32] public lastVerifiedBlocknumbers;
    uint8 public constant DELAY_LIMIT = 32;
    mapping(uint256 => BlockPayload) public blockPayloads;
    address public manager;
    address public blockSetter;
    IRewardsPool public rewardsPool;
    uint8 private _verifiedBlockId = 0;

    // Validation queue struct
    struct BlockPayload {
        address coinbase;
        bytes32 blockHash;
        uint256 blockReward;
        bool isFinalized;
    }

    // Event that emitted after payload set
    event SetPayload(uint256 blockNumber);
    event FinalizeBlock(uint256 blockNumber);
    event Claim(
        address indexed coinbase,
        bytes32 indexed blockNumber,
        uint256 claimedAmount,
        uint256 blockReward
    );

    function initialize(
        address managerAddress,
        address blockSetterAddress,
        address rewardsPoolAddress
    ) external initializer {
        manager = managerAddress;
        blockSetter = blockSetterAddress;
        rewardsPool = IRewardsPool(rewardsPoolAddress);
    }

    // Adds payload to queue
    function setBlockPayload(
        uint256 blockNumber,
        BlockPayload memory blockPayload
    ) external returns (bool) {
        require(
            _msgSender() == blockSetter,
            "setBlockPayload: Unauthorized address."
        );

        require(
            blockPayloads[blockNumber].coinbase == address(0),
            "setBlockPayload: Unable to set block payload."
        );
        blockPayloads[blockNumber] = blockPayload;

        emit SetPayload(blockNumber);

        return true;
    }

    // Finalizes block
    function finalizeBlock(uint256 blockNumber) external returns (bool) {
        require(manager == _msgSender(), "RewardsPool: address is not manager");

        BlockPayload storage payload = blockPayloads[blockNumber];
        require(
            payload.coinbase != address(0),
            "finalizeBlock: Unable to finalize block."
        );

        payload.isFinalized = true;

        if (_verifiedBlockId == DELAY_LIMIT) {
            uint8 i = 0;
            for (i; i < DELAY_LIMIT; i++) {
                BlockPayload memory bp = blockPayloads[
                    lastVerifiedBlocknumbers[i]
                ];

                uint256 result = rewardsPool.claim(bp.coinbase);
                emit Claim(bp.coinbase, bp.blockHash, result, bp.blockReward);
            }

            _verifiedBlockId = 0;
            delete lastVerifiedBlocknumbers;
        }

        lastVerifiedBlocknumbers[_verifiedBlockId] = blockNumber;
        _verifiedBlockId++;

        emit FinalizeBlock(blockNumber);

        return true;
    }
}
