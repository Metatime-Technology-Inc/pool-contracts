
# Metatime Coin Pools

Coin pool contracts are smart contracts designed to facilitate the distribution of coins to participants of coin sales or coin generation events. In the context of Metatime Coin, a coin pool contract would serve as a mechanism to allocate and distribute coins to individuals who participate in the coin sale. The purpose of these contracts is to ensure a fair and transparent distribution of coins, while also providing an efficient way to manage the entire process.


# Disclaimer
This project has previously been used for MTC token distribution on the BSC network. The current version is designed for the MetaChain Mainnet, and the token is distributed over coins. The distribution amounts are calculated based on the user's claim intervals, and to continue this process, the last claimed times in our distribution contracts on the BSC network will be taken as snapshots and reflected in the contracts on the MetaChain in the same manner.

# Specifications

### Project Overview

The project includes a variable to store the total supply of Metatime Coins designated for distribution. This supply is determined prior to the coin sale and can be specified as a fixed value or as a parameter that can be set during contract deployment.

  

The project incorporates a distribution logic that determines how coins are allocated to participants. This logic can be customized based on the specific requirements of the coin sale. For example, it may distribute coins proportionally based on the contribution amount or follow a different allocation mechanism specified by it.

  

The contract defines the criteria that participants must meet to be eligible to receive Metatime Coins. This can include factors such as minimum contribution amounts, specific whitelisting requirements, or adherence to certain regulatory compliance measures like KYC procedures.

  

The project includes provisions for vesting or lock-up periods to govern the release of coins to participants. This can be implemented using time-based conditions or other specified triggers to gradually distribute coins over a specific period, promoting long-term commitment and discouraging immediate dumping.

  

The project includes mechanism to trigger the coin distribution process. This trigger can be automatically triggered based on specific conditions, such as the completion of the coin sale or the passage of a predetermined time period.

  

# Getting Started

Recommended Node version is 16.0.0 and above.

  

### Available commands

  

```bash
# install dependencies
$  yarn  install

# compile contracts
$  npx  hardhat  compile

# run tests
$  npx  hardhat  test

# generate typechain files
$  npx  hardhat  typechain

# compute tests coverage, run "npx hardhat typechain" before using it
$  npx  hardhat  coverage

# deploy contracts
$  yarn hardhat  deploy  --network  <network-name>

# run prettier formatter
$  yarn run  prettier:solidity

# run linter
$  yarn run  solhint

# extract deploy addresses
$  npx  hardhat  extract-deployment-addresses  --network  <network-name>

# extract ABIs
$  npx  hardhat  extract-abis  --network  <network-name>
```

# Project Structure

```
mtc-pools/
├── contracts/
│ ├── core/
│ │ ├── Distributor.sol
│ │ ├── LiquidityPool.sol
│ │ ├── StrategicPool.sol
│ │ ├── TokenDistributor.sol
│ │ └── TokenDistributorWithNoVesting.sol
│ ├── interfaces/
│ │ ├── IDistributor.sol
│ │ └── ITokenDistributor.sol
│ ├── libs/
│ │ ├── MockTrigonometry.sol
│ │ └── Trigonometry.sol
│ └── utils/
│ └── PoolFactory.sol
├── scripts/
│ ├── constants/
│ │ ├── chain-ids.ts
│ │ ├── constructor-params.ts
│ │ ├── contracts.ts
│ │ ├── index.ts
│ │ └── pool-params.ts
│ └── deploy/
│ └── 00_implementations.ts
├── test/
│ ├── distributor.test.ts
│ ├── liquidity-pool.test.ts
│ ├── strategic-pool.test.ts
│ ├── token-distributor-with-no-vesting.test.ts
│ ├── token-distributor.test.ts
│ └── trigonometry.test.ts
├── hardhat.config.ts
├── README.md
└── package.json
```

  

1.  `contracts/`: This directory contains the Solidity smart contracts for the Metatime Token project. The primary contracts, such as `Distributor.sol`, `TokenDistributor.sol` and `PoolFactory.sol` are stored here. Additional contracts or libraries can also be included as needed.

  

3.  `scripts/`: This directory contains Typescript scripts that facilitate various tasks related to the project. For example, `deploy/00_implementations.ts` script deploys the contracts.

  

4.  `test/`: The test directory is where you write and store your test files. These tests verify the functionality and behavior of the smart contracts. Tests can be written using testing frameworks like Mocha or Hardhat's built-in testing functionality.

  

5.  `hardhat.config.ts`: The Hardhat configuration file specifies the network settings, compilation settings, and other configuration options for the project. It includes information such as the compiler version, network connections, and deployment accounts.

  

6.  `README.md`: The README file provides documentation and instructions for setting up and running the project. It includes information about the project, its purpose, installation steps, and other important details.

  

7.  `package.json`: The package.json file contains metadata and dependencies for the project. It includes information about the project's name, version, dependencies, and scripts.

  

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
$  npx  hardhat  deploy  --network  ganache
```
# CONTRACTS

# Distributor Contract

  

The Distributor contract is designed to facilitate the distribution of coins over a specified period of time. It allows users to claim their share of coins based on the distribution rate and period length. This document provides a comprehensive overview of the contract's functionality, including its structure, functions, modifiers, and events.

  

## Contract Structure

  

The Distributor contract is implemented in Solidity. It utilizes the OpenZeppelin library to leverage existing functionality and ensure security best practices. The contract uses the `Ownable` contracts from OpenZeppelin for access control and protection against reentrancy attacks, respectively.

  

## Architecture Overview
![Distributor Schema](https://raw.githubusercontent.com/Metatime-Technology-Inc/metachain/049190d3cc568aa2b0d2cfec57d41492191fa881/resources/schemas/distributor-schema.svg)

  

## Contract Initialization

  

The contract can be initialized by calling the `initialize` function. This function sets up the contract with the specified parameters, including the contract owner, coin distribution pool name, coin address, start and end times of the distribution, distribution rate per period, period length, and claimable amount per period. The initialization function is invoked only once during contract deployment and requires valid parameter values. This function is `external` and can be called by anyone.

  

## Modifiers

  

The contract defines two modifiers to enforce validation and control the settable status of the contract:

  

1.  `isParamsValid`: This modifier validates the pool parameters provided during contract initialization or parameter updates. It ensures that the start time is earlier than the end time and verifies that the distribution rate, period length, and total distribution time are consistent.

  

2.  `isSettable`: This modifier controls the settable status of the contract during parameter updates. It ensures that the contract is not in an active claim period, allowing the contract owner to modify the pool parameters only before the distribution starts. This modifier prevents any modifications once the claim period has begun.

  

## Claiming Coins

  

Users can claim their coins by calling the `claim` function. Only the contract owner can execute this function. When invoked, the function calculates the amount of coins claimable based on the current period and distribution parameters. It updates the claimed amount, last claim time, and the remaining claimable amount. Finally, it transfers the claimed coins to the contract owner's address.

  

## Updating Pool Parameters

  

The contract owner can update the pool parameters by calling the `updatePoolParams` function. This function allows modifications to the start time, end time, distribution rate, period length, and claimable amount of the pool. The `isSettable` modifier ensures that the contract is in a modifiable state, and the `isParamsValid` modifier validates the provided parameter values. Upon successful validation, the function updates the pool parameters, resets the last claim time to the new start time, and emits a `PoolParamsUpdated` event.

  

## Claim Calculation

  

The `calculateClaimableAmount` function determines the amount of coins claimable for the current period. It is a public view function that calculates the claimable amount based on the current timestamp, start time, end time, and remaining claimable amount. If the current timestamp is greater than the end time, the function returns the remaining claimable amount. Otherwise, it delegates the calculation to the `_calculateClaimableAmount` internal function.

  

## Internal Claim Calculation

  

The `_calculateClaimableAmount` internal function is responsible for the actual calculation of the claimable amount. It uses the distribution rate, initial claimable amount, period length, and the period since the last claim to determine the claimable amount. The calculation is based on the formula:

  

```
uint256 amount = (claimableAmount * distributionRate * (block.timestamp - lastClaimTime) * 10  **  18) / (periodLength *  BASE_DIVIDER  *  10  **  18)
```

  

The function converts the time values to fixed-point decimals (18 decimal places) to ensure accurate calculations. It then returns the calculated claimable amount.

  

## Events

  

The contract emits two events to provide transparency and facilitate monitoring:

  

1.  `HasClaimed`: This event is emitted when a beneficiary (the contract owner) successfully claims coins. It includes the beneficiary's address and the amount of coins claimed.

  

2.  `PoolParamsUpdated`: This event is emitted when the pool parameters are updated. It includes the new start time, end time, distribution rate, period length, and claimable amount.

  

## License

  

The contract is licensed under the MIT license, as indicated by the `SPDX-License-Identifier` statement at the beginning of the source code.

  

## LiquidityPool Contract

  

The LiquidityPool contract is a smart contract used for managing a liquidity pool. It allows the owner to deposit coins into the pool and withdraw them as needed.

  

### Contract Overview

The LiquidityPool contract provides the following functionality:

-  **TransferFunds**: Allows the owner to transfer funds from the liquidity pool to a specified address.

-  **_withdraw**: Internal function to withdraw coins from the pool.

  

## Architecture Overview

![LiquidityPool Schema](https://raw.githubusercontent.com/Metatime-Technology-Inc/metachain/049190d3cc568aa2b0d2cfec57d41492191fa881/resources/schemas/liquiditypool-schema.svg)

### Contract Details

#### Events

-  **Withdrew**: Event emitted when coins are withdrawn from the liquidity pool. It includes the amount of coins that were withdrawn.

#### TransferFunds

The `transferFunds` function allows the owner of the contract to transfer funds from the liquidity pool to a specified address. It takes in the `withdrawalAmount` parameter, which specifies the amount of coins to be withdrawn. Only the owner can call this function.

The function internally calls the `_withdraw` function, passing the owner's address and the withdrawal amount. After successful withdrawal, it emits the `Withdrew` event.

#### _withdraw

The `_withdraw` function is an internal function that performs the actual transfer of coins from the liquidity pool to a specified address. It takes in the `_to` parameter, which represents the address to which the coins will be transferred, and the `_withdrawalAmount` parameter, which specifies the amount of coins to be withdrawn.

The function first checks the current balance of the liquidity pool to ensure that it has sufficient coins for withdrawal. It requires that the pool has a positive balance and that the withdrawal amount does not exceed the pool balance. If these conditions are met, the function transfers the coins to the specified address.

The function returns a boolean value indicating the success of the withdrawal.

### Usage

To use the LiquidityPool contract, follow these steps:

1. Deposit coins into the liquidity pool by transferring them to the contract address.

2. When needed, call the `transferFunds` function to transfer coins from the liquidity pool to a specified address.

It's important to note that only the owner of the contract can transfer funds from the liquidity pool.
  


## TokenDistributorWithNoVesting Contract

  

The TokenDistributorWithNoVesting contract is designed for distributing coins during no vesting sales. It allows the contract owner to set claimable amounts for users and enables users to claim their coins within a specified claim period. Additionally, any remaining coins can be swept from the contract by the owner after the claim period ends.

  

### Contract Overview

The TokenDistributorWithNoVesting contract provides the following functionality:

-  **setClaimableAmounts**: Allows the contract owner to set the claimable amounts for a list of users.

-  **claim**: Enables a beneficiary to claim their coins during the claim period.

-  **sweep**: Allows the contract owner to transfer any remaining coins from the contract to their address after the claim period ends.

  

## Architecture Overview

  

![TokenDistributorWithNoVesting Schema](https://raw.githubusercontent.com/Metatime-Technology-Inc/metachain/049190d3cc568aa2b0d2cfec57d41492191fa881/resources/schemas/tokendistributorwithnovesting-schema.svg)

  

### Contract Details

  

#### State Variables

-  **distributionPeriodStart**: The start time of the distribution period.

-  **distributionPeriodEnd**: The end time of the distribution period.

-  **claimPeriodEnd**: The end time of the claim period.

-  **totalAmount**: The total amount of coins available for distribution.

-  **claimableAmounts**: A mapping of beneficiary addresses to their claimable amounts.

  

#### Constructor

The constructor function initializes the TokenDistributorWithNoVesting contract. It takes the following parameters:

-  `_distributionPeriodStart`: The start time of the claim period.

-  `_distributionPeriodEnd`: The end time of the claim period.

  

The constructor validates that the coin address is valid and that the distribution period end time is greater than the start time. It sets the respective state variables accordingly.

  

#### setClaimableAmounts

The `setClaimableAmounts` function allows the contract owner to set the claimable amounts for a list of users. It takes the following parameters:

-  `users`: An array of user addresses.

-  `amounts`: An array of claimable amounts corresponding to each user.

  

The function performs the following steps:

1. Validates that the lengths of the `users` and `amounts` arrays match.

2. Iterates over the users and amounts arrays, setting the claimable amount for each user in the `claimableAmounts` mapping.

3. Emits the `CanClaim` event for each user, indicating the amount they can claim.

4. Calculates the new total claimable amount by summing the existing total amount and the amounts being set.

5. Validates that the contract holds enough coins to cover the total claimable amount.

6. Updates the `totalAmount` state variable with the new total claimable amount.

7. Emits the `SetClaimableAmounts` event, indicating the number of users and the total claimable amount.

  

#### claim

The `claim` function allows a beneficiary to claim their coins during the claim period. It can be called by any address that has claimable coins. The function performs the following steps:

1. Validates that the current timestamp is within the distribution period.

2. Validates that the claim period has not ended.

3. Retrieves the claimable amount for the caller.

4. Validates that there are coins to claim.

5. Sets the claimable amount for the caller to zero.

6. Transfers the claimed coins from the contract to the caller.

7. Emits the `HasClaimed` event, indicating the beneficiary and the amount claimed.

  

#### sweep

The `sweep` function allows the contract owner to transfer any remaining coins from the contract to their address after the claim period ends.

  

It performs the following steps:

1. Validates that the current timestamp is past the claim period end time.

2. Retrieves the remaining coins balance in the contract.

3. Validates that there are remaining coins to sweep.

4. Transfers the remaining coins from the contract to the owner.

5. Emits the `Swept` event, indicating the receiver (owner) and the amount swept.

  

### Usage

To use the TokenDistributorWithNoVesting contract, follow these steps:

1. Deploy the contract, providing the coin being distributed, the start time of the distribution period, and the end time of the distribution period as constructor arguments.

2. As the contract owner, call the `setClaimableAmounts` function to set the claimable amounts for a list of users. Pass the array of user addresses and the corresponding array of claimable amounts.

3. Users can call the `claim` function during the claim period to claim their coins if they have any claimable amount.

4. After the claim period ends, the contract owner can call the `sweep` function to transfer any remaining coins from the contract to their address.

  

Note that the contract owner has additional control and can manage the claimable amounts and the coin distribution process.

  

## StrategicPool Contract

  

The StrategicPool contract is designed for managing a strategic pool of coins. It allows the owner of the contract to burn coins from the pool using a formula or without using a formula.

  

### Contract Overview

The StrategicPool contract provides the following functionality:

-  **burnWithFormula**: Allows the owner to burn coins from the pool using a formula. The burn amount is calculated based on the current price and the number of blocks in two months.

-  **burn**: Allows the owner to burn coins from the pool without using a formula.

-  **calculateBurnAmount**: Calculates the amount of coins to burn using a formula based on the current price and the number of blocks in two months.

  

## Architecture Overview

  

![StrategicPool Schema](https://raw.githubusercontent.com/Metatime-Technology-Inc/metachain/049190d3cc568aa2b0d2cfec57d41492191fa881/resources/schemas/strategicpool-schema.svg)

  

### Contract Details

  

#### State Variables

-  **totalBurnedAmount**: The total amount of coins burned from the pool.

-  **lastBurnedAmount**: The amount of coins burned in the last burn transaction.

-  **constantValueFromFormula**: A constant value used in the burn formula.  


#### burnWithFormula

The `burnWithFormula` function allows the contract owner to burn coins from the pool using a formula. It takes the following parameters:

-  `currentPrice`: The current price used in the burn formula.

-  `blocksInTwoMonths`: The number of blocks in two months used in the burn formula.

  

`burnWithFormula` is a function implemented in our smart contract project that facilitates the burning of funds by calculating the burn amount using a specific formula. The purpose of burning funds is to permanently remove them from circulation, typically to manage coin supply or to provide an incentive for holding or using the coin.

  

We are currently in the process of developing our own blockchain, which includes various functionalities such as smart contracts. However, while the development of our blockchain is ongoing, we need to deploy the burn contract on an existing blockchain network.

  

By deploying the burn contract on another chain, we can leverage the existing infrastructure and functionalities of that chain to facilitate the burning process. This allows us to burn funds according to the specified formula until the development of our own chain is complete.

  

The burnWithFormula function takes into account the parameters specified by the formula to calculate the amount of funds that need to be burned. The exact details of the formula will depend on the specific requirements of your project and the logic you have implemented in the function.

  

Burning Formula: https://metatime.com/assets/tr/whitepaper.pdf at page 48.

  

The function performs the following steps:

1. Calculates the burn amount using the `calculateBurnAmount` function based on the current price and the number of blocks in two months.

2. Validates that the burn amount is greater than zero.

3. Updates the `totalBurnedAmount` and `lastBurnedAmount` state variables with the burn amount.

4. Calls the `burn` function of the coin contract to burn the coins.

5. Emits the `Burned` event, indicating the amount burned and that the burn was done using the formula.

  

#### burn

The `burn` function allows the contract owner to burn coins from the pool without using a formula. It takes the following parameter:

-  `burnAmount`: The amount of coins to burn.

  

The function performs the following steps:

1. Updates the `totalBurnedAmount` state variable with the burn amount.

2. Sends the given amount to zero address.

3. Emits the `Burned` event, indicating the amount burned and that the burn was done without using the formula.
  

#### calculateBurnAmount

The `calculateBurnAmount` function calculates the amount of coins to burn using a formula. It takes the following parameters:

-  `_currentPrice`: The current price used in the burn formula.

-  `_blocksInTwoMonths`: The number of blocks in two months used in the burn formula.

  

The function performs a complex calculation to determine the burn amount based on the provided parameters and the `totalBurnedAmount`. The calculation involves trigonometric functions and mathematical operations. The result is returned as an `int256` value.

  

### Usage

To use the StrategicPool contract, follow these steps:

1. As the contract owner, you can choose to burn coins from the pool using either the `burnWithFormula` function or the `burn` function.

- If using `burnWithFormula`, provide the current price and the number of blocks in two months as function arguments.

- If using `burn`, provide the amount of coins to burn as the function argument.

3. The coins will be burned from the pool, and the `Burned` event will be emitted to indicate the burned amount and whether the burn was done using the formula or not.

  

Note: Ensure that you have the required permissions to burn coins from the pool and that you provide valid inputs for the burn calculations.

  

# TokenDistributor Contract

  

The TokenDistributor contract is a Solidity smart contract designed for distributing coins among users over a specific period of time. It allows the contract owner to set claimable amounts for users before the claim period starts and enables users to claim their coins during the distribution period. Any remaining coins after the claim period can be swept by the contract owner.

  

## Contract Overview

  

The TokenDistributor contract includes the following main features:

  

1.  **Initialization:** The contract is initialized with the necessary parameters, including the contract owner, pool name, distribution period start and end times, distribution rate, and period length.

  

2.  **Claimable Amounts:** The contract owner can set the claimable amounts for a list of users before the claim period starts. The claimable amounts are stored in the `claimableAmounts` mapping, and the remaining claimable amounts are stored in the `leftClaimableAmounts` mapping. Each user can claim their available coins during the distribution period.

  

3.  **Claiming Coins:** Users can claim their available coins by calling the `claim()` function. The function calculates the claimable amount based on the number of days that have passed since the user's last claim. The claimed coins are transferred to the user's address.

  

4.  **Sweeping Remaining Coins:** After the claim period ends, the contract owner can sweep any remaining coins by calling the `sweep()` function. The remaining coins are transferred to the contract owner's address.

  

5.  **Updating Pool Parameters:** Before the claim period starts, the contract owner can update the pool parameters, including the distribution period start and end times, distribution rate, and period length. This allows flexibility in adjusting the distribution parameters if needed.

  

## Architecture Overview

  

![TokenDistributor Schema](https://raw.githubusercontent.com/Metatime-Technology-Inc/metachain/049190d3cc568aa2b0d2cfec57d41492191fa881/resources/schemas/tokendistributor-schema.svg)

  

## Contract Structure

  

The TokenDistributor contract is structured as follows:

  

1.  **Imports:** The contract imports required dependencies from the OpenZeppelin library, including `Ownable`, and `Initializable`.

  

2.  **State Variables:**

  

-  `poolName`: A string variable that represents the name of the coin distribution pool.

-  `distributionPeriodStart`: An unsigned integer representing the start time of the distribution period.

-  `distributionPeriodEnd`: An unsigned integer representing the end time of the distribution period.

-  `claimPeriodEnd`: An unsigned integer representing the end time of the claim period.

-  `periodLength`: An unsigned integer representing the length of each distribution period in seconds.

-  `distributionRate`: An unsigned integer representing the distribution rate as a percentage.

-  `totalClaimableAmount`: An unsigned integer representing the total claimable amount that participants can claim.

-  `claimableAmounts`: A mapping that associates user addresses with their claimable amounts.

-  `claimedAmounts`: A mapping that associates user addresses with their claimed amounts.

-  `lastClaimTimes`: A mapping that associates user addresses with their last claim times.

-  `leftClaimableAmounts`: A mapping that associates user addresses with their remaining claimable amounts.

-  `hasClaimableAmountsSet`: A boolean flag used to prevent updating pool parameters after the claimable amounts have been set.

  

3.  **Events:**

  

-  `Swept`: An event emitted when the contract owner sweeps remaining coins. It includes the receiver's address and the amount of coins swept.

-  `CanClaim`: An event emitted when a user can claim coins. It includes the beneficiary's address and the claimable amount.

-  `HasClaimed`: An event emitted when a user has claimed coins. It includes

  

the beneficiary's address and the claimed amount.

-  `SetClaimableAmounts`: An event emitted when claimable amounts are set. It includes the number of users and the total claimable amount.

-  `PoolParamsUpdated`: An event emitted when pool parameters are updated. It includes the new distribution period start and end times, distribution rate, and period length.

  

4.  **Modifiers:**

  

-  `isParamsValid`: A modifier that validates the pool parameters, ensuring that the end time is after the start time and the calculated distribution duration matches the given parameters.

-  `isSettable`: A modifier that ensures that the contract is in a settable state, allowing the owner to set claimable amounts and update pool parameters before the claim period starts.

  

5.  **Constructor Function:**

  

- The constructor function initializes the contract by disabling the execution of initializers and preventing accidental execution when creating proxy instances of the contract.

  

6.  **Initialization Function:**

  

- The `initialize` function initializes the TokenDistributor contract with the required parameters. It sets the contract owner, pool name, distribution period start and end times, distribution rate, and period length.

  

7.  **Set Claimable Amounts Function:**

  

- The `setClaimableAmounts` function allows the contract owner to set the claimable amounts for a list of users before the claim period starts. It verifies that the provided lists of users and amounts have matching lengths and assigns the claimable amounts to the users. The function also updates the total claimable amount and emits the `SetClaimableAmounts` event.

  

8.  **Claim Function:**

  

- The `claim` function allows a user to claim their available coins during the distribution period. It calculates the claimable amount based on the number of days that have passed since the user's last claim. The function updates the claimed amount, last claim time, and remaining claimable amount for the user. It also transfers the claimed coins to the user's address and emits the `HasClaimed` event.

  

9.  **Sweep Function:**

  

- The `sweep` function allows the contract owner to sweep any remaining coins after the claim period ends. It verifies that the claim period has ended and transfers the remaining coins to the contract owner's address. The function emits the `Swept` event.

  

10.  **Update Pool Parameters Function:**

  

- The `updatePoolParams` function allows the contract owner to update the pool parameters before the claim period starts. It verifies that the claimable amounts have not been set before and updates the distribution period start and end times, claim period end time, distribution rate, and period length. The function emits the `PoolParamsUpdated` event.

  

11.  **Claimable Amount Calculation Functions:**

  

- The `calculateClaimableAmount` function calculates the claimable amount of coins for a given user. It verifies that the claim period has not ended and the distribution period has started. The function calls the `_calculateClaimableAmount` internal function to perform the actual calculation based on the user's initial claimable amount and the number of days since their last claim.

  

- The `_calculateClaimableAmount` internal function calculates the amount of coins that can be claimed by a given address. It uses the user's initial claimable amount, the distribution rate, the number of days since their last claim, and the base divider for calculations.

  

## Usage and Workflow

  

1. Contract Deployment:

- Deploy the TokenDistributor contract on the Ethereum network.

- Provide the necessary parameters for initialization, including the contract owner, pool name, distribution period start and end times, distribution rate, and period length.

  

2. Setting Claimable Amounts:

- Before the claim period starts

  

, call the `setClaimableAmounts` function as the contract owner.

- Provide an array of user addresses and corresponding claimable amounts.

- Ensure that the provided lists have matching lengths.

- The function assigns the claimable amounts to the users, updates the total claimable amount, and emits the `SetClaimableAmounts` event.

  

3. Claiming Coins:

- During the distribution period, users can call the `claim` function to claim their available coins.

- The function calculates the claimable amount based on the number of days that have passed since the user's last claim.

- It updates the claimed amount, last claim time, and remaining claimable amount for the user.

- The claimed coins are transferred to the user's address, and the `HasClaimed` event is emitted.

  

4. Sweeping Remaining Coins:

- After the claim period ends, the contract owner can call the `sweep` function to transfer any remaining coins to their address.

- The function verifies that the claim period has ended and emits the `Swept` event.

  

5. Updating Pool Parameters:

- Before the claim period starts, the contract owner can call the `updatePoolParams` function to update the pool parameters.

- Provide the new distribution period start and end times, distribution rate, and period length.

- The function verifies that the claimable amounts have not been set before and updates the parameters accordingly.

- The `PoolParamsUpdated` event is emitted.

  

Note: It is important to follow the contract's usage guidelines and ensure that the contract owner performs necessary actions within the appropriate timeframes.