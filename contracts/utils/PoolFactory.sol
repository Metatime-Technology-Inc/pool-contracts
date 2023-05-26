// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "../core/Distributor.sol";
import "../core/TokenDistributor.sol";
import "../interfaces/IDistributor.sol";
import "../interfaces/ITokenDistributor.sol";

contract PoolFactory is Ownable2Step {
  uint256 public distributorCount;
  uint256 public tokenDistributorCount;

  mapping(uint256 => address) private _distributors;
  mapping(uint256 => address) private _tokenDistributors;

  address public immutable distributorImplementation;
  address public immutable tokenDistributorImplementation;

  event DistributorCreated(address creatorAddress, address distributorAddress, uint256 distributorId);
  event TokenDistributorCreated(address creatorAddress, address tokenDistributorAddress, uint256 distributorId);

  constructor() {
    _transferOwnership(_msgSender());

    distributorImplementation = address(new Distributor());
    tokenDistributorImplementation = address(new TokenDistributor());
  }

  function getDistributor(uint256 distributorId) external view returns(address) {
    return _distributors[distributorId];
  }

  function getTokenDistributor(uint256 tokenDistributorId) external view returns(address) {
    return _tokenDistributors[tokenDistributorId];
  }

  function createDistributor(
      string memory poolName, 
      address token, 
      uint256 startTime, 
      uint256 endTime, 
      uint256 distributionRate,
      uint256 periodLength,
      uint256 claimableAmount
    ) onlyOwner external returns(uint256) {
        address newDistributorAddress = Clones.clone(distributorImplementation);
        IDistributor newDistributor = IDistributor(newDistributorAddress);
        newDistributor.initialize(owner(), poolName, IERC20(token), startTime, endTime, distributionRate, periodLength, claimableAmount);

        emit DistributorCreated(owner(), newDistributorAddress, distributorCount);

        return _addNewDistributor(newDistributorAddress);
  }

  function createTokenDistributor(
      string memory poolName, 
      address token, 
      uint256 startTime, 
      uint256 endTime, 
      uint256 distributionRate,
      uint256 periodLength
    ) onlyOwner external returns(uint256) {
        address newTokenDistributorAddress = Clones.clone(tokenDistributorImplementation);
        ITokenDistributor newTokenDistributor = ITokenDistributor(newTokenDistributorAddress);
        newTokenDistributor.initialize(owner(), poolName, IERC20(token), startTime, endTime, distributionRate, periodLength);

        emit TokenDistributorCreated(owner(), newTokenDistributorAddress, tokenDistributorCount);

        return _addNewTokenDistributor(newTokenDistributorAddress);
  }

  function _addNewDistributor(address _newDistributorAddress) internal returns(uint256) {
        _distributors[distributorCount] = _newDistributorAddress;
        distributorCount++;

        return distributorCount - 1;
  }

  function _addNewTokenDistributor(address _newDistributorAddress) internal returns(uint256) {
        _tokenDistributors[tokenDistributorCount] = _newDistributorAddress;
        tokenDistributorCount++;

        return tokenDistributorCount - 1;
  }
}