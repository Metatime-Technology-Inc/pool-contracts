import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MTC } from "../typechain-types/contracts/core/MTC";

describe('MTC Contract', () => {
    let mtc: MTC;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();

        const MTC = await ethers.getContractFactory('MTC');
        mtc = await MTC.connect(owner).deploy(100000); // Set an appropriate initial supply

        await mtc.deployed();
    });

    describe('submitPools', () => {
        it('should submit pools and distribute tokens accordingly', async () => {
            const pools: MTC.PoolStruct[] = [
                {
                    name: 'Pool1',
                    addr: addr1.address,
                    lockedAmount: 1000,
                },
                {
                    name: 'Pool2',
                    addr: addr2.address,
                    lockedAmount: 2000,
                },
            ];

            await mtc.submitPools(pools);

            // Check if the tokens were transferred to the pools correctly
            expect(await mtc.balanceOf(addr1.address)).to.equal(1000);
            expect(await mtc.balanceOf(addr2.address)).to.equal(2000);
        });

        it('should emit the PoolSubmitted event for each submitted pool', async () => {
            const pools: MTC.PoolStruct[] = [
                {
                    name: 'Pool1',
                    addr: addr1.address,
                    lockedAmount: 1000,
                },
                {
                    name: 'Pool2',
                    addr: addr2.address,
                    lockedAmount: 2000,
                },
            ];

            await expect(mtc.submitPools(pools))
                .to.emit(mtc, 'PoolSubmitted')
                .withArgs('Pool1', addr1.address, 1000)
                .and.to.emit(mtc, 'PoolSubmitted')
                .withArgs('Pool2', addr2.address, 2000);
        });

        it('should update the total locked amount correctly', async () => {
            const pools: MTC.PoolStruct[] = [
                {
                    name: 'Pool1',
                    addr: addr1.address,
                    lockedAmount: 1000,
                },
                {
                    name: 'Pool2',
                    addr: addr2.address,
                    lockedAmount: 2000,
                },
            ];

            const pool1BalanceBefore = await mtc.balanceOf(pools[0].addr);
            const pool2BalanceBefore = await mtc.balanceOf(pools[1].addr);
            await mtc.submitPools(pools);
            const pool1BalanceAfter = await mtc.balanceOf(pools[0].addr);
            const pool2BalanceAfter = await mtc.balanceOf(pools[1].addr);

            expect(pool1BalanceAfter).to.equal(pool1BalanceBefore.add(1000));
            expect(pool2BalanceAfter).to.equal(pool1BalanceBefore.add(2000));
        });

        it('should revert if the caller is not the contract owner', async () => {
            const pools: MTC.PoolStruct[] = [
                {
                    name: 'Pool1',
                    addr: addr1.address,
                    lockedAmount: 1000,
                },
                {
                    name: 'Pool2',
                    addr: addr2.address,
                    lockedAmount: 2000,
                },
            ];

            await expect(mtc.connect(addr1).submitPools(pools)).to.be.revertedWith(
                'Ownable: caller is not the owner'
            );
        });

        it('should handle an empty pools array', async () => {
            const pools: MTC.PoolStruct[] = [];

            await mtc.submitPools(pools);

            // Check if the tokens remain in the owner's balance
            expect(await mtc.balanceOf(owner.address)).to.equal(100000);
        });
    });
});
