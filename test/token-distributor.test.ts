import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import { incrementBlocktimestamp, toWei, getBlockTimestamp } from "../scripts/helpers";

const METATIME_TOKEN_SUPPLY = 10_000_000_000;
const SEED_SALE_AMOUNT = 100_000_000;
const PUBLIC_SALE_AMOUNT = 700_000_000;

describe("Token Distributor", function () {
  async function initiateVariables() {
    const [deployer, beneficiary_1, beneficiary_2, beneficiary_3] =
      await ethers.getSigners();

    const TokenDistributorProxyManager = await ethers.getContractFactory(
      CONTRACTS.utils.TokenDistributorProxyManager
    );
    const MetatimeToken = await ethers.getContractFactory(
      CONTRACTS.core.MetatimeToken,
    );
    const tokenDistributorProxyManager = await TokenDistributorProxyManager.connect(deployer).deploy();
    const metatimeToken = await MetatimeToken.connect(deployer).deploy();

    return {
      tokenDistributorProxyManager,
      metatimeToken,
      deployer,
      beneficiary_1,
      beneficiary_2,
      beneficiary_3
    };
  }

  describe("Initiate", async () => {
    it("Initiate TokenDistributor contract & claim amounts", async function () {
      const {
        tokenDistributorProxyManager,
        metatimeToken,
        deployer,
        beneficiary_1,
        beneficiary_2,
        beneficiary_3
      } = await loadFixture(initiateVariables);

      const currentBlockTimestamp = await getBlockTimestamp(ethers);
      const LISTING_TIMESTAMP = currentBlockTimestamp + 500_000;
      const SECONDS_IN_A_DAY = 60 * 24 * 60;

      const poolInfo = [
        {
          name: "Seed Sale 1",
          token: metatimeToken.address,
          startTime: LISTING_TIMESTAMP,
          endTime: LISTING_TIMESTAMP + (SECONDS_IN_A_DAY * 250),
          distributionRate: 40,
          period: 86400,
        },
        {
          name: "Public Sale",
          token: metatimeToken.address,
          startTime: LISTING_TIMESTAMP,
          endTime: LISTING_TIMESTAMP + (SECONDS_IN_A_DAY * 100),
          distributionRate: 100,
          period: 86400,
        }
      ];

      const createPoolProxyPromisesList = poolInfo.map(async (pi) => {
        const tx = await tokenDistributorProxyManager.connect(deployer).createPoolProxy(pi.name, pi.token, pi.startTime, pi.endTime, pi.distributionRate, pi.period);
        return await tx.wait();
      });

      await Promise.all(createPoolProxyPromisesList);

      const seedSale1PoolAddress = await tokenDistributorProxyManager.getPoolProxy(0);
      const publicSalePoolAddress = await tokenDistributorProxyManager.getPoolProxy(1);

      const TokenDistributor = await ethers.getContractFactory(CONTRACTS.core.TokenDistributor);
      const seedSale1Proxy = TokenDistributor.attach(seedSale1PoolAddress);
      const publicSaleProxy = TokenDistributor.attach(publicSalePoolAddress);

      expect(await seedSale1Proxy.poolName()).to.be.equal(poolInfo[0].name);
      expect(await publicSaleProxy.poolName()).to.be.equal(poolInfo[1].name);

      const balanceOfDeployer = await metatimeToken.connect(deployer).balanceOf(deployer.address);
      expect(balanceOfDeployer).to.be.equal(toWei(String(METATIME_TOKEN_SUPPLY)));

      const transferSeedSale1Funds = await metatimeToken.connect(deployer).transfer(seedSale1Proxy.address, toWei(String(SEED_SALE_AMOUNT)));
      const transferPublicSaleFunds = await metatimeToken.connect(deployer).transfer(publicSaleProxy.address, toWei(String(PUBLIC_SALE_AMOUNT)));

      await transferSeedSale1Funds.wait();
      await transferPublicSaleFunds.wait();

      expect(await metatimeToken.balanceOf(seedSale1Proxy.address)).to.be.equal(toWei(String(SEED_SALE_AMOUNT)));
      expect(await metatimeToken.balanceOf(publicSaleProxy.address)).to.be.equal(toWei(String(PUBLIC_SALE_AMOUNT)));

      expect(await seedSale1Proxy.owner()).to.be.equal(deployer.address);
      expect(await publicSaleProxy.owner()).to.be.equal(deployer.address);

      const claimableAccounts = [
        [
          {
            address: beneficiary_1.address,
            amount: toWei(String(50_000_000)),
          },
          {
            address: beneficiary_2.address,
            amount: toWei(String(25_000_000)),
          },
          {
            address: beneficiary_3.address,
            amount: toWei(String(25_000_000)),
          }
        ],
        [
          {
            address: beneficiary_1.address,
            amount: toWei(String(500_000_000)),
          },
          {
            address: beneficiary_2.address,
            amount: toWei(String(100_000_000)),
          },
          {
            address: beneficiary_3.address,
            amount: toWei(String(100_000_000)),
          }
        ]
      ]

      const seedSale1Addresses = claimableAccounts[0].map(ca => ca.address);
      const seedSale1Amounts = claimableAccounts[0].map(ca => ca.amount);

      const publicSaleAddresses = claimableAccounts[1].map(ca => ca.address);
      const publicSaleAmounts = claimableAccounts[1].map(ca => ca.amount);

      const setClaimableAmountsSeedSale1 = await seedSale1Proxy.connect(deployer).setClaimableAmounts(seedSale1Addresses, seedSale1Amounts);
      const setClaimableAmountsPublicSale = await publicSaleProxy.connect(deployer).setClaimableAmounts(publicSaleAddresses, publicSaleAmounts);

      await setClaimableAmountsSeedSale1.wait();
      await setClaimableAmountsPublicSale.wait();

      // This is equal to approximately 1 days+ of claim amount of each address
      await incrementBlocktimestamp(ethers, 600_000);

      let seedSale1ClaimTx = await seedSale1Proxy.connect(beneficiary_1).claim();
      await seedSale1ClaimTx.wait();

      let publicSaleClaimTx = await publicSaleProxy.connect(beneficiary_1).claim();
      await publicSaleClaimTx.wait();

      await incrementBlocktimestamp(ethers, 600_000);

      seedSale1ClaimTx = await seedSale1Proxy.connect(beneficiary_1).claim();
      await seedSale1ClaimTx.wait();

      publicSaleClaimTx = await publicSaleProxy.connect(beneficiary_1).claim();
      await publicSaleClaimTx.wait();
      
      // This is equal to both seed sale 1 and public sale claim time
      await incrementBlocktimestamp(ethers, SECONDS_IN_A_DAY * 1000);

      expect(await seedSale1Proxy.connect(beneficiary_1).claim()).to.be.reverted;
      expect(await publicSaleProxy.connect(beneficiary_1).claim()).to.be.reverted;
    });
  });
});