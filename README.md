# Metatime Token Pools
Token pool contracts are smart contracts designed to facilitate the distribution of tokens to participants of token sales or token generation events. In the context of Metatime Token, a token pool contract would serve as a mechanism to allocate and distribute tokens to individuals who participate in the token sale. The purpose of these contracts is to ensure a fair and transparent distribution of tokens, while also providing an efficient way to manage the entire process.

# Specifications
### Project Overview
The project includes a variable to store the total supply of Metatime Tokens designated for distribution. This supply is determined prior to the token sale and can be specified as a fixed value or as a parameter that can be set during contract deployment.

The project incorporates a distribution logic that determines how tokens are allocated to participants. This logic can be customized based on the specific requirements of the token sale. For example, it may distribute tokens proportionally based on the contribution amount or follow a different allocation mechanism specified by it.

The contract defines the criteria that participants must meet to be eligible to receive Metatime Tokens. This can include factors such as minimum contribution amounts, specific whitelisting requirements, or adherence to certain regulatory compliance measures like KYC procedures.

The project includes provisions for vesting or lock-up periods to govern the release of tokens to participants. This can be implemented using time-based conditions or other specified triggers to gradually distribute tokens over a specific period, promoting long-term commitment and discouraging immediate dumping.

The project incorporates functionality for participant verification and compliance. This may involve integrating a whitelisting mechanism to ensure only approved participants can receive tokens, and incorporating KYC procedures to gather and verify participant identity information, if necessary.

The project includes mechanism to trigger the token distribution process. This trigger can be automatically triggered based on specific conditions, such as the completion of the token sale or the passage of a predetermined time period.

# Getting Started
Recommended Node version is 16.0.0 and above.

### Available commands

```bash
# install dependencies
$ npm install

# compile contracts
$ npx hardhat compile

# run tests
$ npx hardhat test

# compute tests coverage
$ npm run coverage

# deploy contracts
$ npm hardhat deploy --network <network-name>

# run prettier formatter
$ npm run prettier:solidity

# run linter
$ npm run solhint

# extract deploy addresses
$ npx hardhat extract-deployment-addresses --network <network-name>

# extract ABIs
$ npx hardhat extract-abis --network <network-name>
```

# Project Structure

```
mtc-pools/
├── contracts/
│   ├── core/
│   │   ├── Distributor.sol
│   │   ├── LiquidityPool.sol
│   │   ├── MTC.sol
│   │   ├── PrivateSaleTokenDistributor.sol
│   │   ├── StrategicPool.sol
│   │   └── TokenDistributor.sol
│   ├── interfaces/
│   │   ├── IDistributor.sol
│   │   ├── IMTC.sol
│   │   └── ITokenDistributor.sol
│   ├── libs/
│   │   └── Trigonometry.sol
│   └── utils/
│       ├── MultiSigWallet.sol
│       └── PoolFactory.sol
├── scripts/
│   ├── constants/
│   │   ├── chain-ids.ts
│   │   ├── constructor-params.ts
│   │   ├── contracts.ts
│   │   ├── index.ts
│   │   └── pool-params.ts
│   └── deploy/
│       └── 00_mtc_and_pools.ts
├── test/
│   ├── distributor.test.ts
│   ├── liquidity-pool.test.ts
│   ├── mtc.test.ts
│   ├── multi-sig-wallet.test.ts
│   ├── privatesaletokendistributor.test.ts
│   ├── strategic-pool.test.ts
│   └── token-distributor.test.ts
├── hardhat.config.ts
├── README.md
└── package.json
```

1. `contracts/`: This directory contains the Solidity smart contracts for the Metatime Token project. The primary contracts, such as `Distributor.sol`, `TokenDistributor.sol` and `PoolFactory.sol` are stored here. Additional contracts or libraries can also be included as needed.

3. `scripts/`: This directory contains Typescript scripts that facilitate various tasks related to the project. For example, `deploy/0_mtc_and_pools.ts` script deploys the contracts.

4. `test/`: The test directory is where you write and store your test files. These tests verify the functionality and behavior of the smart contracts. Tests can be written using testing frameworks like Mocha or Hardhat's built-in testing functionality.

5. `hardhat.config.ts`: The Hardhat configuration file specifies the network settings, compilation settings, and other configuration options for the project. It includes information such as the compiler version, network connections, and deployment accounts.

6. `README.md`: The README file provides documentation and instructions for setting up and running the project. It includes information about the project, its purpose, installation steps, and other important details.

7. `package.json`: The package.json file contains metadata and dependencies for the project. It includes information about the project's name, version, dependencies, and scripts.

## Deploy
Deploy script can be found in the `scripts/deploy` folder.

Rename `./.env.example` to `./.env` in the project root.
To add the private key of a deployer account, assign the following variables
```
DEPLOYER_PRIVATE_KEY=...
DEPLOYER=...
GANACHE_URL=
```
example:
```bash
$ npx hardhat deploy --network ganache
```

# CONTRACTS

# Distributor Contract

## Description

The Distributor contract is responsible for holding tokens that contract owner can claim over a specified period of time. It allows for the distribution of tokens in regular periods based on predefined parameters. Its purpose is distributing tokens for project owner/owners.

## Architecture Overview
![Distributor Schema](https://raw.githubusercontent.com/ismailcanvardar/mtc-pools/7df75c8beaed39e713b4e6047ebfc8e4a8ed1182/resources/schemas/distributor-schema.svg)

## Contract Details

- **SPDX-License-Identifier**: MIT
- **Solidity Version**: 0.8.0

## Imports

The contract imports the following external libraries and contracts:

- `IERC20` from "@openzeppelin/contracts/token/ERC20/IERC20.sol": The interface for ERC20 tokens.
- `Ownable2Step` from "@openzeppelin/contracts/access/Ownable2Step.sol": A contract that provides ownership control with a two-step process.
- `Initializable` from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol": A contract that allows for contract initialization.
- `SafeERC20` from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol": A library for safely handling ERC20 token transfers.
- `ReentrancyGuard` from "@openzeppelin/contracts/security/ReentrancyGuard.sol": A contract that provides protection against reentrancy attacks.

## State Variables

- `poolName`: The name of the token distribution pool.
- `token`: The ERC20 token to be distributed.
- `startTime`: The start time of the distribution.
- `endTime`: The end time of the distribution.
- `periodLength`: The length of each distribution period.
- `distributionRate`: The rate of token distribution per period.
- `BASE_DIVIDER`: A constant representing the base divider for distribution rate calculation.
- `claimableAmount`: The total amount of tokens claimable per period.
- `claimedAmount`: The total amount of tokens claimed so far.
- `lastClaimTime`: The timestamp of the last token claim.
- `leftClaimableAmount`: The remaining amount of tokens available for claiming.

## Events

- `Swept(address receiver, uint256 amount)`: Emitted when leftover tokens are swept to the owner.
- `HasClaimed(address indexed beneficiary, uint256 amount)`: Emitted when a beneficiary has claimed tokens.
- `PoolParamsUpdated(uint256 newStartTime, uint256 newEndTime, uint256 newDistributionRate, uint256 newPeriodLength, uint256 newClaimableAmount)`: Emitted when pool parameters are updated.

## Modifiers

- `isParamsValid(uint256 _startTime, uint256 _endTime, uint256 _distributionRate, uint256 _periodLength)`: A modifier that validates the pool parameters.

## Functions

### `initialize`

```solidity
function initialize(
    address _owner,
    string memory _poolName,
    address _token,
    uint256 _startTime,
    uint256 _endTime,
    uint256 _distributionRate,
    uint256 _periodLength,
    uint256 _claimableAmount
) external initializer isParamsValid(_startTime, _endTime, _distributionRate, _periodLength)
```

- Initializes the contract with the specified parameters.
- Must be called after the contract is deployed and before any other functions are called.
- Parameters:
  - `_owner`: The address of the contract owner.
  - `_poolName`: The name of the token distribution pool.
  - `_token`: The address of the ERC20 token to be distributed.
  - `_startTime`: The start time of the distribution.
  - `_endTime`: The end time of the distribution.
  - `_distributionRate`: The rate of token distribution per period.
  - `_periodLength`:

 The length of each distribution period.
  - `_claimableAmount`: The total amount of tokens claimable per period.

### `claim`

```solidity
function claim() external onlyOwner nonReentrant returns (bool)
```

- Claims tokens for the contract owner.
- Transfers the calculated claimable amount of tokens to the owner.
- Emits a `HasClaimed` event.
- Returns a boolean indicating the success of the claim.

### `sweep`

```solidity
function sweep() external onlyOwner
```

- Transfers any leftover tokens in the contract to the owner.
- Can only be called by the contract owner.
- Emits a `Swept` event.

### `updatePoolParams`

```solidity
function updatePoolParams(
    uint256 newStartTime,
    uint256 newEndTime,
    uint256 newDistributionRate,
    uint256 newPeriodLength,
    uint256 newClaimableAmount
) external onlyOwner isParamsValid(newStartTime, newEndTime, newDistributionRate, newPeriodLength) returns (bool)
```

- Updates the pool parameters before the claim period.
- Only callable by the contract owner.
- Parameters:
  - `newStartTime`: The new start timestamp of the claim period.
  - `newEndTime`: The new end timestamp of the claim period.
  - `newDistributionRate`: The new distribution rate of each claim.
  - `newPeriodLength`: The new distribution duration of each claim.
  - `newClaimableAmount`: The new claimable amount of the pool.
- Emits a `PoolParamsUpdated` event.
- Returns a boolean indicating the success of the parameter update.

### `calculateClaimableAmount`

```solidity
function calculateClaimableAmount() public view returns (uint256)
```

- Calculates the amount of tokens claimable for the current period.
- Returns the amount of tokens claimable for the current period.

### `_calculateClaimableAmount`

```solidity
function _calculateClaimableAmount() internal view returns (uint256)
```

- Internal function to calculate the amount of tokens claimable for the current period.
- Returns the amount of tokens claimable for the current period.

## TokenDistributor Contract

**SPDX-License-Identifier:** MIT

**pragma solidity 0.8.16;**

### Overview

The TokenDistributor contract is designed to distribute tokens among users over a specific period of time. It allows the contract owner to set claimable amounts for users, and users can claim their tokens during the distribution period.

## Architecture Overview
![TokenDistributor Schema](https://raw.githubusercontent.com/ismailcanvardar/mtc-pools/7df75c8beaed39e713b4e6047ebfc8e4a8ed1182/resources/schemas/tokendistributor-schema.svg)

### Contract Details

- The contract utilizes the OpenZeppelin library and imports various contracts such as `IERC20`, `Ownable2Step`, `SafeERC20`, `Initializable`, and `ReentrancyGuard`.
- The contract is initialized with the following parameters:
  - `owner`: The address of the contract owner.
  - `poolName`: The name of the token distribution pool.
  - `token`: The ERC20 token being distributed.
  - `distributionPeriodStart`: The start time of the distribution period
  - `distributionPeriodEnd`: The end time of the distribution period
  - `claimPeriodEnd`: The end time of claim period
  - `distributionRate`: The distribution rate (percentage).
  - `periodLength`: The length of each distribution period (in seconds).

### Contract Functions

#### `initialize`

```solidity
function initialize(
    address _owner,
    string memory _poolName,
    address _token,
    uint256 _distributionPeriodStart,
    uint256 _distributionPeriodEnd,
    uint256 _distributionRate,
    uint256 _periodLength
) external initializer isParamsValid(_startTime, _endTime, _distributionRate, _periodLength)
```

- Initializes the TokenDistributor contract with the provided parameters.
- It is an initializer function and can only be called once during contract deployment.
- Parameters:
  - `_owner`: The address of the contract owner.
  - `_poolName`: The name of the token distribution pool.
  - `_token`: The ERC20 token being distributed.
  -  `_distributionPeriodStart` The start time of the distribution period.
  - `_distributionPeriodEnd`: The end time of the distribution period.
  - `_distributionRate`: The distribution rate (percentage).
  - `_periodLength`: The length of each distribution period (in seconds).

#### `setClaimableAmounts`

```solidity
function setClaimableAmounts(
    address[] calldata users,
    uint256[] calldata amounts
) external onlyOwner isSettable
```

- Sets the claimable amounts for a list of users.
- Only the contract owner can call this function before the claim period starts.
- Parameters:
  - `users`: An array of user addresses.
  - `amounts`: An array of claimable amounts corresponding to each user.

#### `claim`

```solidity
function claim() external nonReentrant returns (bool)
```

- Allows a user to claim their available tokens.
- Tokens can only be claimed during the distribution period.
- Returns a boolean indicating the success of the claim.

#### `sweep`

```solidity
function sweep() external onlyOwner
```

- Allows the contract owner to sweep any remaining tokens after the claim period ends.
- Tokens are transferred to the contract owner's address.

#### `updatePoolParams`

```solidity
function updatePoolParams(
    uint256 newDistributionPeriodStart,
    uint256 newDistributionPeriodEnd,
    uint256 newDistributionRate,
    uint256 newPeriodLength
) external onlyOwner isParamsValid(newStartTime, newEndTime, newDistributionRate, newPeriodLength) returns (bool)
```

- Updates the pool parameters before the claim period.
- Only callable by the contract owner.
- Parameters:
  - `newDistributionPeriodStart`: The new start timestamp of the claim period.
  - `newDistributionPeriodEnd`: The new end timestamp of the claim period.
  - `newDistributionRate`: The new distribution rate of each claim.
  - `newPeriodLength`: The new distribution

 duration of each claim.
- Returns a boolean indicating the success of the update.

#### `calculateClaimableAmount`

```solidity
function calculateClaimableAmount(address user) public view returns (uint256)
```

- Calculates the claimable amount of tokens for a given user.
- The claimable amount depends on the number of days that have passed since the last claim.
- Parameters:
  - `user`: The address of the user.
- Returns the claimable amount of tokens for the user.

### Events

The TokenDistributor contract emits the following events:

#### `Swept`

```solidity
event Swept(address receiver, uint256 amount);
```

- Emitted when the contract owner sweeps remaining tokens.
- Parameters:
  - `receiver`: The address of the receiver (contract owner).
  - `amount`: The amount of tokens swept.

#### `CanClaim`

```solidity
event CanClaim(address indexed beneficiary, uint256 amount);
```

- Emitted when a user can claim tokens.
- Parameters:
  - `beneficiary`: The address of the user.
  - `amount`: The amount of tokens that can be claimed.

#### `HasClaimed`

```solidity
event HasClaimed(address indexed beneficiary, uint256 amount);
```

- Emitted when a user has claimed tokens.
- Parameters:
  - `beneficiary`: The address of the user.
  - `amount`: The amount of tokens claimed.

#### `SetClaimableAmounts`

```solidity
event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount);
```

- Emitted when claimable amounts are set for users.
- Parameters:
  - `usersLength`: The number of users.
  - `totalAmount`: The total claimable amount set.

#### `PoolParamsUpdated`

```solidity
event PoolParamsUpdated(
    uint256 newDistributionPeriodStart,
    uint256 newDistributionPeriodEnd,
    uint256 newDistributionRate,
    uint256 newPeriodLength
);
```

- Emitted when the pool parameters are updated.
- Parameters:
  - `newDistributionPeriodStart`: The new start timestamp of the claim period.
  - `newDistributionPeriodEnd`: The new end timestamp of the claim period.
  - `newDistributionRate`: The new distribution rate of each claim.
  - `newPeriodLength`: The new distribution duration of each claim.

### Modifiers

#### `isParamsValid`

```solidity
modifier isParamsValid(
    uint256 _distributionPeriodStart,
    uint256 _distributionPeriodEnd,
    uint256 _distributionRate,
    uint256 _periodLength
)
```

- A modifier that validates the pool parameters.
- It checks if the provided parameters are valid.
- Parameters:
  - `_distributionPeriodStart`: Start timestamp of the claim period.
  - `_distributionPeriodEnd`: End timestamp of the claim period.
  - `_distributionRate`: Distribution rate of each claim.
  - `_periodLength`: Distribution duration of each claim.

#### `isSettable`

```solidity
modifier isSettable()
```

- A modifier that controls the settable status of the contract while setting addresses and their amounts.
- It prevents updates to the pool parameters once the claim period has started.

### Constants

- `BASE_DIVIDER`: The base divider used for calculations. It is set to `10_000`.

### Storage

The TokenDistributor contract includes the following storage variables:

- `poolName`: The name of the token distribution pool.
- `token`: The ERC20 token being distributed.
- `distributionPeriodStart`: The start time of the distribution period.
- `distributionPeriodEnd`: The end time of the distribution period.
- `claimPeriodEnd`: The end time of claim period.
- `periodLength`: The length of each distribution period (in seconds).
- `distributionRate`: The distribution rate (percentage).
- `claimableAmounts`: A mapping of user addresses to their claimable amounts.
- `claimedAmounts`: A mapping of user addresses to their claimed amounts.
- `lastClaimTimes`: A mapping of user addresses to their last claim times.
- `leftClaimableAmounts`: A mapping of user addresses to their remaining claimable amounts.
- `hasClaimableAmountsSet`: A boolean flag used to prevent updating pool parameters.

# PoolFactory Contract

## Description

The `PoolFactory` contract is responsible for creating `Distributor` and `TokenDistributor` contracts. It provides functions to create new instances of these contracts and retrieve their addresses based on their IDs. The contract is also equipped with access control functionality provided by the `Ownable2Step` contract.

## Architecture Overview
![PoolFactory Schema](https://raw.githubusercontent.com/ismailcanvardar/mtc-pools/7df75c8beaed39e713b4e6047ebfc8e4a8ed1182/resources/schemas/poolfactory-schema.svg)

## Contract Details

- **SPDX-License-Identifier:** MIT
- **Solidity Version:** 0.8.0

## Dependencies

The contract imports the following external contracts:

- `Ownable2Step.sol` from the OpenZeppelin library: A contract that implements multi-step ownership transfer functionality.
- `Clones.sol` from the OpenZeppelin library: A contract that facilitates the creation of clone contracts.

The contract also imports the following local contracts:

- `Distributor.sol`: The implementation contract for the `Distributor` contracts.
- `TokenDistributor.sol`: The implementation contract for the `TokenDistributor` contracts.

## State Variables

- `distributorCount` (uint256): A counter for the number of created `Distributor` contracts.
- `tokenDistributorCount` (uint256): A counter for the number of created `TokenDistributor` contracts.
- `_distributors` (mapping(uint256 => address)): A mapping to store `Distributor` contract addresses by their IDs.
- `_tokenDistributors` (mapping(uint256 => address)): A mapping to store `TokenDistributor` contract addresses by their IDs.
- `distributorImplementation` (address): The address of the implementation contract for `Distributor` contracts.
- `tokenDistributorImplementation` (address): The address of the implementation contract for `TokenDistributor` contracts.

## Events

The contract emits the following events:

- `DistributorCreated(address creatorAddress, address distributorAddress, uint256 distributorId)`: Emitted when a `Distributor` contract is created.
- `TokenDistributorCreated(address creatorAddress, address tokenDistributorAddress, uint256 tokenDistributorId)`: Emitted when a `TokenDistributor` contract is created.

## Modifiers

The contract defines the following modifier:

- `onlyOwner`: Restricts access to functions with the contract owner.

## Functions

### Constructor

The constructor initializes the contract by transferring ownership to the deployer and setting the addresses for the implementation contracts of `Distributor` and `TokenDistributor`.

```solidity
constructor()
```

#### Parameters

None.

### getDistributor

A view function that returns the address of a `Distributor` contract based on the distributor ID.

```solidity
function getDistributor(uint256 distributorId) external view returns (address)
```

#### Parameters

- `distributorId` (uint256): The ID of the `Distributor` contract.

#### Returns

- `address`: The address of the `Distributor` contract.

### getTokenDistributor

A view function that returns the address of a `TokenDistributor` contract based on the tokenDistributor ID.

```solidity
function getTokenDistributor(uint256 tokenDistributorId) external view returns (address)
```

#### Parameters

- `tokenDistributorId` (uint256): The ID of the `TokenDistributor` contract.

#### Returns

- `address`: The address of the `TokenDistributor` contract.

### createDistributor

Creates a new `Distributor` contract.

```solidity
function createDistributor(
    string memory poolName,
    address token,
    uint256 startTime,
    uint256 endTime,
    uint256 distributionRate,
    uint256 periodLength,
    uint256 claimableAmount
) external onlyOwner returns (uint256)
```

#### Parameters

- `pool

Name` (string): The name of the pool.
- `token` (address): The address of the token contract.
- `startTime` (uint256): The start time of the distribution.
- `endTime` (uint256): The end time of the distribution.
- `distributionRate` (uint256): The distribution rate.
- `periodLength` (uint256): The length of each distribution period.
- `claimableAmount` (uint256): The total amount claimable per period.

#### Returns

- `uint256`: The ID of the created `Distributor` contract.

### createTokenDistributor

Creates a new `TokenDistributor` contract.

```solidity
function createTokenDistributor(
    string memory poolName,
    address token,
    uint256 startTime,
    uint256 endTime,
    uint256 distributionRate,
    uint256 periodLength
) external onlyOwner returns (uint256)
```

#### Parameters

- `poolName` (string): The name of the pool.
- `token` (address): The address of the token contract.
- `startTime` (uint256): The start time of the distribution.
- `endTime` (uint256): The end time of the distribution.
- `distributionRate` (uint256): The distribution rate.
- `periodLength` (uint256): The length of each distribution period.

#### Returns

- `uint256`: The ID of the created `TokenDistributor` contract.

### Internal Functions

The contract also defines the following internal functions:

- `_addNewDistributor(address _newDistributorAddress) internal returns (uint256)`: Adds a new `Distributor` contract address to the mapping and returns its ID.
- `_addNewTokenDistributor(address _newDistributorAddress) internal returns (uint256)`: Adds a new `TokenDistributor` contract address to the mapping and returns its ID.

# PrivateSaleTokenDistributor Contract

## Contract Overview

The `PrivateSaleTokenDistributor` contract is designed to distribute tokens during a private sale. It allows the contract owner to set claimable amounts for a list of users and enables beneficiaries to claim their tokens during a specified claim period. The contract also provides a function to sweep any remaining tokens to the owner after the claim period ends.

## Architecture Overview
![TokenDistributor Schema](https://raw.githubusercontent.com/ismailcanvardar/mtc-pools/7df75c8beaed39e713b4e6047ebfc8e4a8ed1182/resources/schemas/privatesaletokendistributor-schema.svg)

## Contract Details

### Contract Metadata

- **Contract Name**: PrivateSaleTokenDistributor
- **SPDX License Identifier**: MIT

### Prerequisites

- Solidity Version: 0.8.16
- External Contracts:
  - OpenZeppelin's `IERC20` contract
  - OpenZeppelin's `Ownable2Step` contract
  - OpenZeppelin's `SafeERC20` library
  - OpenZeppelin's `ReentrancyGuard` contract

### Contract Variables

- `token` (IERC20): The token being distributed.
- `startTime` (uint256): The start time of the claim period.
- `endTime` (uint256): The end time of the claim period.
- `totalAmount` (uint256): The total amount of tokens available for distribution.
- `claimableAmounts` (mapping(address => uint256)): Mapping of beneficiary addresses to their claimable amounts.

### Events

The following events are emitted by the contract:

- `CanClaim(address indexed beneficiary, uint256 amount)`: Emitted when a beneficiary can claim tokens.
- `HasClaimed(address indexed beneficiary, uint256 amount)`: Emitted when a beneficiary claims tokens.
- `Swept(address receiver, uint256 amount)`: Emitted when tokens are swept from the contract.
- `SetClaimableAmounts(uint256 usersLength, uint256 totalAmount)`: Emitted when claimable amounts are set.

### Modifiers

- `isSettable()`: Controls the settable status of the contract while trying to set addresses and their amounts. It ensures that the claim period has not already started.

### Contract Functions

1. `constructor(IERC20 _token, uint256 _startTime, uint256 _endTime)`: Initializes the contract by setting the token, start time, and end time of the claim period.

2. `setClaimableAmounts(address[] calldata users, uint256[] calldata amounts) external onlyOwner isSettable`: Allows the contract owner to set the claimable amounts for a list of users. It takes an array of user addresses and an array of corresponding claimable amounts.

3. `claim() external nonReentrant`: Allows a beneficiary to claim their tokens. Tokens can only be claimed once the claim period has started. The function transfers the claimable amount of tokens to the beneficiary.

4. `sweep() external onlyOwner`: Transfers any remaining tokens from the contract to the owner. This function can only be called after the claim period has ended.

## Usage

1. Deploy the `PrivateSaleTokenDistributor` contract, providing the token, start time, and end time for the claim period.
2. Call the `setClaimableAmounts` function, passing the list of user addresses and their corresponding claimable amounts. This can only be done before the claim period starts.
3. Beneficiaries can call the `claim` function to claim their tokens once the claim period has started.
4. After the claim period ends, the contract owner can call the `sweep` function to transfer any remaining tokens to their address.

# LiquidityPool Contract

## SPDX-License-Identifier: MIT

The LiquidityPool contract is licensed under the MIT License. This license allows you to freely use, modify, and distribute the contract, subject to certain conditions. You should review the full text of the MIT License to understand your rights and responsibilities.

## Overview

The LiquidityPool contract is designed to manage a liquidity pool and facilitate the transfer of funds from the pool to a specified address. It utilizes the ERC20 standard for token management and extends the Ownable2Step contract for ownership control.

## Architecture Overview
![TokenDistributor Schema](https://raw.githubusercontent.com/ismailcanvardar/mtc-pools/7df75c8beaed39e713b4e6047ebfc8e4a8ed1182/resources/schemas/liquiditypool-schema.svg)

## Prerequisites

To use this contract, you need to have the following:

- Solidity compiler version 0.8.16
- OpenZeppelin contracts library, including:
  - IERC20.sol
  - Ownable2Step.sol
  - SafeERC20.sol

You can import these dependencies from the appropriate locations:

```solidity
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
```

## Contract Details

### Contract Declaration

```solidity
contract LiquidityPool is Ownable2Step {
    IERC20 public token; // Token to be distributed

    event Withdrew(uint256 amount); // Event emitted when tokens are withdrawn from the pool

    // ...
}
```

The LiquidityPool contract inherits from the Ownable2Step contract, which provides a two-step ownership transfer mechanism. It declares a public variable `token` of type IERC20 to represent the token used in the liquidity pool. The `Withdrew` event is emitted when tokens are withdrawn from the pool.

### Constructor

```solidity
constructor(IERC20 _token) {
    _transferOwnership(_msgSender());

    token = _token;
}
```

The constructor initializes the contract by transferring ownership to the deployer and setting the `token` variable to the specified `_token` value.

### Transfer Funds

```solidity
function transferFunds(uint256 withdrawalAmount) external onlyOwner {
    _withdraw(owner(), withdrawalAmount);

    emit Withdrew(withdrawalAmount);
}
```

The `transferFunds` function allows the contract owner to transfer funds from the liquidity pool to a specified address. It calls the internal `_withdraw` function with the owner's address and the specified `withdrawalAmount`. After the successful withdrawal, it emits the `Withdrew` event.

### Internal Withdrawal Function

```solidity
function _withdraw(address _to, uint256 _withdrawalAmount) internal returns (bool) {
    uint256 poolBalance = token.balanceOf(address(this));
    require(poolBalance > 0 && _withdrawalAmount <= poolBalance, "_withdraw: No tokens to withdraw");

    SafeERC20.safeTransfer(token, _to, _withdrawalAmount);

    return true;
}
```

The `_withdraw` function performs the actual withdrawal of tokens from the pool. It first checks the balance of the pool and ensures that it has sufficient tokens to fulfill the withdrawal request. If the conditions are met, it uses the `SafeERC20` library to safely transfer the specified `_withdrawalAmount` of tokens to the `_to` address. The function returns `true` if the withdrawal is successful.

## Events

### Withdrew

```solidity
event Withdrew(uint256 amount);
```

The `Withdrew` event is emitted when tokens are successfully withdrawn from the liquidity pool. The `amount` parameter indicates the number of tokens that were withdrawn.

## Usage

To use the LiquidityPool contract, follow these steps:

1. Deploy the

 contract, passing the desired ERC20 token as the `_token` parameter in the constructor.

2. Interact with the contract through the following functions:
   - `transferFunds`: This function allows the owner to transfer funds from the pool to a specified address.

## StrategicPool Contract

### Contract Overview

The `StrategicPool` contract is a Solidity contract used for managing a strategic pool of tokens. It allows for burning tokens from the pool using a formula or without using a formula. The contract implements the `Ownable2Step` and `ReentrancyGuard` contracts to handle ownership and prevent reentrancy attacks, respectively.

## Architecture Overview
![TokenDistributor Schema](https://raw.githubusercontent.com/ismailcanvardar/mtc-pools/7df75c8beaed39e713b4e6047ebfc8e4a8ed1182/resources/schemas/strategicpool-schema.svg)

### Contract Details

- **SPDX-License-Identifier:** MIT
- **Solidity Version:** 0.8.0

### Dependencies

The contract imports the following dependencies:

- `Ownable2Step.sol` from the OpenZeppelin library: This contract provides a two-step ownership transfer mechanism.
- `SafeERC20.sol` from the OpenZeppelin library: This contract provides safe ERC20 token transfer functions.
- `ReentrancyGuard.sol` from the OpenZeppelin library: This contract prevents reentrancy attacks.
- `IMTC.sol`: This is an interface contract for the token managed by the pool.
- `Trigonometry.sol`: This is a library contract that provides trigonometric functions.

### Contract Structure

The `StrategicPool` contract is structured as follows:

#### State Variables

- `token` (type: `IMTC`): The token managed by the pool.
- `totalBurnedAmount` (type: `int256`): The total amount of tokens burned from the pool.
- `constantValueFromFormula` (type: `int256`): A constant value used in the burn formula.

#### Events

- `Burned(uint256 amount, bool withFormula)`: Event emitted when tokens are burned from the pool. It provides information about the burned amount and whether the formula was used.

#### Constructor

- `constructor(IMTC _token)`: The constructor function accepts an `IMTC` token parameter and sets the token and owner of the contract.

#### External Functions

- `burnWithFormula(int256 currentPrice, int256 blocksInTwoMonths)`: Burns tokens from the pool using a formula. It takes the current price and the number of blocks in two months as parameters. This function can only be called by the owner of the contract and is non-reentrant.

### Note: 
- Burn formula: https://metatime.com/assets/en/whitepaper.pdf at page 48.

- `burn(uint256 burnAmount)`: Burns tokens from the pool without using a formula. It takes the amount of tokens to burn as a parameter. This function can only be called by the owner of the contract and is non-reentrant.

#### Public Functions

- `calculateBurnAmount(int256 _currentPrice, int256 _blocksInTwoMonths)`: Calculates the amount of tokens to burn using a formula. It takes the current price and the number of blocks in two months as parameters and returns the amount of tokens to burn. This function is view-only and does not modify the contract state.

### Usage

1. Deploy the `StrategicPool` contract, providing the address of the token to be managed by the pool as a constructor parameter.
2. Call the `burnWithFormula` function to burn tokens from the pool using the provided formula, passing the current price and the number of blocks in two months as parameters.
3. Alternatively, call the `burn` function to burn tokens from the pool without using the formula, passing the amount of tokens to burn as a parameter.

Trigonometry Library:
- Thanks for this https://github.com/Sikorkaio/sikorka/blob/master/contracts/trigonometry.sol repository. It makes us to calculate burn formula, easily.

## MTC Contract

## Architecture Overview
![TokenDistributor Schema](https://raw.githubusercontent.com/ismailcanvardar/mtc-pools/7df75c8beaed39e713b4e6047ebfc8e4a8ed1182/resources/schemas/mtc-schema.svg)

### SPDX-License-Identifier: MIT

This contract is governed by the MIT License, which is a permissive open-source license. It allows users to freely use, modify, and distribute the contract with limited restrictions. 

### Pragma

The `pragma solidity 0.8.16;` statement specifies the Solidity compiler version required to compile this contract. In this case, it requires version 0.8.0 or higher.

### Imports

The contract imports various Solidity files from the OpenZeppelin library:

- `ERC20.sol`: This file implements the ERC20 token standard, providing basic functionality for managing a fungible token.
- `ERC20Burnable.sol`: This file extends the ERC20 contract and adds the ability to burn (destroy) tokens.
- `Ownable2Step.sol`: This file provides an implementation of the ownable pattern, allowing for ownership control with a two-step process.

### Contract: MTC

The `MTC` contract is an ERC20 token contract that mints and distributes Metatime Tokens to different pools based on Metatime Tokenomics.

#### Struct: Pool

The `Pool` struct represents a pool and contains the following properties:

- `name`: A string representing the name of the pool.
- `addr`: The address of the pool.
- `lockedAmount`: The amount of tokens locked in the pool.

#### Events

- `PoolSubmitted`: This event is emitted when a pool is submitted, indicating the name, address, and locked amount of the pool.

#### Constructor

The constructor function initializes the MTC contract. It takes the total supply of the MTC token as an argument and performs the following actions:

- Calls the `ERC20` constructor to set the name and symbol of the token.
- Transfers the ownership of the contract to the deployer by calling the `_transferOwnership` function.
- Mints the specified `_totalSupply` amount of tokens to the deployer by calling the `_mint` function.

#### Function: submitPools

The `submitPools` function allows the contract owner to submit pools and distribute tokens from the owner's balance accordingly. It takes an array of `Pool` structures as an argument and returns a boolean value indicating whether the pools were successfully submitted.

The function performs the following actions:

- Iterates over the `pools` array.
- Checks if the pool address is not the zero address.
- Transfers the specified `lockedAmount` of tokens from the owner's balance to the pool address using the `transfer` function inherited from `ERC20`.
- Emits the `PoolSubmitted` event with the pool name, address, and locked amount.
- Updates the `totalLockedAmount` by adding the `lockedAmount` of the current pool.
- Returns `true` indicating successful pool submission.

### Usage

To use this contract, you need to deploy it with the desired total supply of MTC tokens. After deployment, the contract owner can submit pools using the `submitPools` function, specifying the pool name, address, and locked amount. The tokens will be transferred from the owner's balance to the pool addresses. The `PoolSubmitted` event will be emitted for each pool submission.

Certainly! Here's a documentation for the provided Solidity contract:

# MultiSigWallet Contract

## Overview
The MultiSigWallet contract is a multi-signature wallet contract designed for executing transactions with multiple owner confirmations. It allows a group of owners to collectively control a wallet and ensure that transactions are executed only when a specified number of owners confirm them.

## Architecture Overview
![TokenDistributor Schema](https://raw.githubusercontent.com/ismailcanvardar/mtc-pools/7df75c8beaed39e713b4e6047ebfc8e4a8ed1182/resources/schemas/multisigwallet-schema.svg)

## Contract Details
### Contract Address
The contract can be deployed at a specific address on the Ethereum blockchain.

### License
This contract is licensed under the MIT License.

### Prerequisites
- Solidity compiler version 0.8.0 or higher is required.

### Events
The following events are emitted by the contract:

1. `Deposit(address indexed sender, uint256 amount, uint256 balance)`: Emitted when funds are deposited into the contract.
    - `sender`: Address of the account that sent the funds.
    - `amount`: The amount of funds deposited.
    - `balance`: The updated balance of the contract after the deposit.

2. `SubmitTransaction(address indexed owner, uint256 indexed txIndex, address indexed to, uint256 value, bytes data)`: Emitted when a new transaction is submitted.
    - `owner`: Address of the owner who submitted the transaction.
    - `txIndex`: Index of the transaction in the `transactions` array.
    - `to`: Address of the recipient of the transaction.
    - `value`: The value (in wei) to be sent with the transaction.
    - `data`: Additional data to be included in the transaction.

3. `ConfirmTransaction(address indexed owner, uint256 indexed txIndex)`: Emitted when an owner confirms a transaction.
    - `owner`: Address of the owner who confirmed the transaction.
    - `txIndex`: Index of the confirmed transaction in the `transactions` array.

4. `RevokeConfirmation(address indexed owner, uint256 indexed txIndex)`: Emitted when an owner revokes their confirmation for a transaction.
    - `owner`: Address of the owner who revoked the confirmation.
    - `txIndex`: Index of the transaction in the `transactions` array.

5. `ExecuteTransaction(address indexed owner, uint256 indexed txIndex)`: Emitted when a transaction is successfully executed.
    - `owner`: Address of the owner who executed the transaction.
    - `txIndex`: Index of the executed transaction in the `transactions` array.

### State Variables
1. `address[] public owners`: An array containing the addresses of all owners of the wallet.
2. `mapping(address => bool) public isOwner`: A mapping to check if an address is an owner.
3. `uint256 public numConfirmationsRequired`: The number of owner confirmations required for executing a transaction.
4. `struct Transaction`: A structure representing a transaction.
    - `address to`: Address of the recipient of the transaction.
    - `uint256 value`: The value (in wei) to be sent with the transaction.
    - `bytes data`: Additional data to be included in the transaction.
    - `bool executed`: Flag indicating if the transaction has been executed.
    - `uint256 numConfirmations`: The number of owner confirmations received for the transaction.
5. `mapping(uint256 => mapping(address => bool)) public isConfirmed`: A mapping to check if an owner has confirmed a transaction.
6. `Transaction[] public transactions`: An array containing all the transactions.

### Modifiers
1. `modifier onlyOwner()`: A modifier that restricts the execution of a function to only the owners of the wallet.
2. `modifier txExists(uint256 _txIndex)`: A modifier that checks if a transaction with the given index exists.
3. `modifier notExecuted(uint256 _

txIndex)`: A modifier that checks if a transaction with the given index has not been executed.
4. `modifier notConfirmed(uint256 _txIndex)`: A modifier that checks if the sender has not confirmed the transaction with the given index.

### Constructor
The constructor of the contract accepts two parameters:
1. `address[] memory _owners`: An array of addresses representing the initial owners of the wallet.
2. `uint256 _numConfirmationsRequired`: The number of owner confirmations required for executing a transaction.

### Fallback Function
The contract defines a fallback function that allows it to receive Ether. It emits the `Deposit` event when funds are deposited.

### Public and External Functions

1. `submitTransaction(address _to, uint256 _value, bytes memory _data)`: Submits a new transaction to the contract.
    - Requires: The function can only be called by one of the owners.
    - Parameters:
        - `_to`: Address of the recipient of the transaction.
        - `_value`: The value (in wei) to be sent with the transaction.
        - `_data`: Additional data to be included in the transaction.
    - Emits: `SubmitTransaction` event.

2. `confirmTransaction(uint256 _txIndex)`: Confirms a transaction.
    - Requires: The function can only be called by one of the owners.
    - Parameters:
        - `_txIndex`: Index of the transaction to confirm.
    - Modifiers:
        - `txExists`: Checks if a transaction with the given index exists.
        - `notExecuted`: Checks if the transaction has not been executed.
        - `notConfirmed`: Checks if the sender has not confirmed the transaction.
    - Emits: `ConfirmTransaction` event.

3. `executeTransaction(uint256 _txIndex)`: Executes a transaction.
    - Requires: The function can only be called by one of the owners.
    - Parameters:
        - `_txIndex`: Index of the transaction to execute.
    - Modifiers:
        - `txExists`: Checks if a transaction with the given index exists.
        - `notExecuted`: Checks if the transaction has not been executed.
    - Emits: `ExecuteTransaction` event.

4. `revokeConfirmation(uint256 _txIndex)`: Revokes the confirmation for a transaction.
    - Requires: The function can only be called by one of the owners.
    - Parameters:
        - `_txIndex`: Index of the transaction to revoke the confirmation.
    - Modifiers:
        - `txExists`: Checks if a transaction with the given index exists.
        - `notExecuted`: Checks if the transaction has not been executed.
    - Emits: `RevokeConfirmation` event.

5. `getOwners() external view returns (address[] memory)`: Returns the array of wallet owners.

6. `getTransactionCount() external view returns (uint256)`: Returns the total number of transactions.

7. `getTransaction(uint256 _txIndex) external view returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations)`: Returns the details of a specific transaction.
    - Parameters:
        - `_txIndex`: Index of the transaction to fetch.
    - Returns:
        - `to`: Address of the recipient of the transaction.
        - `value`: The value (in wei) sent with the transaction.
        - `data`: Additional data included in the transaction.
        - `executed`: Flag indicating if the transaction has been executed.
        - `numConfirmations`: The number of owner confirmations received for the transaction.

## Usage
1. Deploy the contract to an Ethereum network using Solidity compiler version 0.8.0 or higher.
2. Pass an array of initial owners' addresses and the required number of confirmations to the constructor.
3. Owners can deposit Ether into the contract by sending funds to its address.
4. Owners can submit transactions using the `submitTransaction` function.
5. Other owners can confirm the submitted transactions using the `confirmTransaction` function.
6. Once the required number of confirmations is reached for a transaction, any owner can execute it using the `executeTransaction` function.
7. Owners can revoke their confirmations using the `revokeConfirmation` function.
8. Use the provided getter functions (`getOwners`, `getTransactionCount`, `getTransaction`) to retrieve information about the wallet and transactions.