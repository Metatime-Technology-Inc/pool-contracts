// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/Context.sol";

import "../interfaces/IMinerHealthCheck.sol";
import "../interfaces/IMetaPoints.sol";

contract Macrominer is Context {
    enum Type {
        Archive,
        Fullnode,
        Light
    }

    uint256 public constant STAKE_AMOUNT = 100 ether;
    uint256 public constant VOTE_POINT_LIMIT = 100;

    uint256 public archiveCount;
    uint256 public fullnodeCount;
    uint256 public lightCount;
    uint256 public voteId;
    IMinerHealthCheck public minerHealthCheck =
        IMinerHealthCheck(0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5);
    IMetaPoints public metapoints =
        IMetaPoints(0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5);

    struct Miner {
        Type _type;
        bool exist;
    }

    struct Vote {
        uint256 voteId;
        uint256 point;
    }

    mapping(address => mapping(Type => Miner)) public miners;
    mapping(address => mapping(Type => Vote)) public votes;

    event AddMiner(address indexed miner, Type indexed _type);
    event KickMiner(address indexed miner, Type indexed _type);

    event BeginVote(
        uint256 indexed voteId,
        address indexed miner,
        Type indexed _type
    );
    event Voted(
        uint256 indexed voteId,
        address indexed miner,
        Type indexed _type,
        uint256 point
    );
    event EndVote(
        uint256 indexed voteId,
        address indexed miner,
        Type indexed _type
    );

    modifier isMiner(address miner, Type _type) {
        require(miners[miner][_type].exist == true, "Address is not miner.");
        _;
    }

    modifier notMiner(address miner, Type _type) {
        require(
            miners[miner][_type].exist == false,
            "Address is already miner."
        );
        _;
    }

    function setMiner(
        Type _type
    ) external payable notMiner(_msgSender(), _type) returns (bool) {
        require(
            msg.value == STAKE_AMOUNT,
            "You have to stake as required STAKE_AMOUNT."
        );

        miners[_msgSender()][_type] = Miner(_type, true);
        _minerIncrement(_type);

        emit AddMiner(_msgSender(), _type);

        return (true);
    }

    // metapoint hard cap for each address
    // vote mech for kick miner from pool, auto unstake for miner, for 100 vote point -> unstake
    // to be miner miners have to stake
    function checkMinerStatus(
        address votedMinerAddress,
        Type[2] memory minerTypes
    )
        external
        isMiner(votedMinerAddress, minerTypes[0])
        isMiner(_msgSender(), minerTypes[1])
    {
        // check status
        bool isAlive = minerHealthCheck.status(
            votedMinerAddress,
            _formatType(minerTypes[0])
        );

        Vote storage vote = votes[votedMinerAddress][minerTypes[0]];

        // -- false status
        if (isAlive == false) {
            // --- get checkers mp points
            uint256 mpBalance = metapoints.balanceOf(_msgSender());

            if (vote.point == 0) {
                vote.voteId = voteId;
                voteId++;

                emit BeginVote(vote.voteId, votedMinerAddress, minerTypes[0]);
            }

            if (mpBalance + vote.point >= VOTE_POINT_LIMIT) {
                // --- check if its bigger than limit after adding voting points, then decrement miner count and suspand miner
                _kickMiner(votedMinerAddress, minerTypes[0]);

                emit EndVote(vote.voteId, votedMinerAddress, minerTypes[0]);
            } else {
                // --- check if its lower than limit after adding voting points, then increment voting points
                vote.point += mpBalance;

                emit Voted(
                    vote.voteId,
                    votedMinerAddress,
                    minerTypes[0],
                    mpBalance
                );
            }
        } else {
            delete votes[votedMinerAddress][minerTypes[0]];

            emit EndVote(vote.voteId, votedMinerAddress, minerTypes[0]);
        }
    }

    function _kickMiner(
        address minerAddress,
        Type _type
    ) internal returns (bool) {
        delete miners[minerAddress][_type];
        delete votes[minerAddress][_type];
        (bool sent, ) = payable(minerAddress).call{value: STAKE_AMOUNT}("");
        _minerDecrement(_type);

        require(sent, "Unstake failed.");

        emit KickMiner(minerAddress, _type);

        return (true);
    }

    function _formatType(
        Type _type
    ) internal pure returns (IMinerHealthCheck.MinerType) {
        if (_type == Type.Archive) {
            return (IMinerHealthCheck.MinerType.Archive);
        } else if (_type == Type.Fullnode) {
            return (IMinerHealthCheck.MinerType.Fullnode);
        } else if (_type == Type.Light) {
            return (IMinerHealthCheck.MinerType.Light);
        }

        revert("Not as expected.");
    }

    function _minerIncrement(Type _type) internal returns (bool) {
        if (_type == Type.Archive) {
            archiveCount++;
        } else if (_type == Type.Fullnode) {
            fullnodeCount++;
        } else if (_type == Type.Light) {
            lightCount++;
        }

        return (true);
    }

    function _minerDecrement(Type _type) internal returns (bool) {
        if (_type == Type.Archive) {
            archiveCount--;
        } else if (_type == Type.Fullnode) {
            fullnodeCount--;
        } else if (_type == Type.Light) {
            lightCount--;
        }

        return (true);
    }

    receive() external payable {}
}
