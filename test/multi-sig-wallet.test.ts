import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CONTRACTS } from "../scripts/constants";
import { Contract } from "ethers";
import { toWei } from "../scripts/helpers";

describe("MultiSigWallet", () => {
    let owners: SignerWithAddress[];
    let randomUser: SignerWithAddress;
    let multiSigWallet: Contract;

    beforeEach(async () => {
        const [user_1, user_2, user_3, user_4] = await ethers.getSigners();
        owners = [user_1, user_2, user_3];
        randomUser = user_4;

        const MultiSigWallet = await ethers.getContractFactory(CONTRACTS.utils.MultiSigWallet);
        multiSigWallet = await MultiSigWallet.deploy(owners.map((owner) => owner.address), 2);
        await multiSigWallet.deployed();

        await owners[0].sendTransaction({
            to: multiSigWallet.address,
            value: toWei(String("100"))
        });
    });

    it("should allow owners to submit and execute transactions", async () => {
        const recipient = owners[1].address;
        const value = ethers.utils.parseEther("1.0");
        const data = "0x";

        await multiSigWallet.connect(owners[0]).submitTransaction(recipient, value, data);

        const txCount = await multiSigWallet.getTransactionCount();
        expect(txCount).to.equal(1);

        const transaction = await multiSigWallet.getTransaction(0);
        expect(transaction.to).to.equal(recipient);
        expect(transaction.value).to.equal(value);
        expect(transaction.data).to.equal(data);
        expect(transaction.executed).to.be.false;
        expect(transaction.numConfirmations).to.equal(0);

        await multiSigWallet.connect(owners[1]).confirmTransaction(0);
        await multiSigWallet.connect(owners[2]).confirmTransaction(0);

        const confirmedTransaction = await multiSigWallet.getTransaction(0);
        expect(confirmedTransaction.numConfirmations).to.equal(2);

        await multiSigWallet.connect(owners[0]).executeTransaction(0);

        const executedTransaction = await multiSigWallet.getTransaction(0);
        expect(executedTransaction.executed).to.be.true;
    });

    it("should prevent non-owners from submitting transactions", async () => {
        const recipient = owners[1].address;
        const value = ethers.utils.parseEther("1.0");
        const data = "0x";

        await expect(multiSigWallet.connect(randomUser).submitTransaction(recipient, value, data))
            .to.be.revertedWith("not owner");
    });

    it("should prevent owners from confirming a transaction twice", async () => {
        const recipient = owners[1].address;
        const value = ethers.utils.parseEther("1.0");
        const data = "0x";

        await multiSigWallet.connect(owners[0]).submitTransaction(recipient, value, data);
        await multiSigWallet.connect(owners[1]).confirmTransaction(0);

        await expect(multiSigWallet.connect(owners[1]).confirmTransaction(0))
            .to.be.revertedWith("tx already confirmed");
    });

    it("should prevent executing a transaction without required confirmations", async () => {
        const recipient = owners[1].address;
        const value = ethers.utils.parseEther("1.0");
        const data = "0x";

        await multiSigWallet.connect(owners[0]).submitTransaction(recipient, value, data);

        await expect(multiSigWallet.connect(owners[0]).executeTransaction(0))
            .to.be.revertedWith("cannot execute tx");
    });

    it("should allow an owner to revoke their confirmation", async () => {
        const recipient = owners[1].address;
        const value = ethers.utils.parseEther("1.0");
        const data = "0x";

        await multiSigWallet.connect(owners[0]).submitTransaction(recipient, value, data);
        await multiSigWallet.connect(owners[1]).confirmTransaction(0);

        await multiSigWallet.connect(owners[1]).revokeConfirmation(0);

        const transaction = await multiSigWallet.getTransaction(0);
        expect(transaction.numConfirmations).to.equal(0);
    });

    it("should prevent executing a transaction if already executed", async () => {
        const recipient = owners[1].address;
        const value = ethers.utils.parseEther("1.0");
        const data = "0x";

        await multiSigWallet.connect(owners[0]).submitTransaction(recipient, value, data);
        await multiSigWallet.connect(owners[1]).confirmTransaction(0);
        await multiSigWallet.connect(owners[2]).confirmTransaction(0);
        await multiSigWallet.connect(owners[0]).executeTransaction(0);

        await expect(multiSigWallet.connect(owners[0]).executeTransaction(0))
            .to.be.revertedWith("tx already executed");
    });

    it("should prevent confirming a non-existing transaction", async () => {
        await expect(multiSigWallet.connect(owners[0]).confirmTransaction(0))
            .to.be.revertedWith("tx does not exist");
    });

    it("should prevent revoking confirmation of a non-existing transaction", async () => {
        await expect(multiSigWallet.connect(owners[0]).revokeConfirmation(0))
            .to.be.revertedWith("tx does not exist");
    });

    it("should prevent confirming an already confirmed transaction", async () => {
        const recipient = owners[1].address;
        const value = ethers.utils.parseEther("1.0");
        const data = "0x";

        await multiSigWallet.connect(owners[0]).submitTransaction(recipient, value, data);
        await multiSigWallet.connect(owners[1]).confirmTransaction(0);

        await expect(multiSigWallet.connect(owners[1]).confirmTransaction(0))
            .to.be.revertedWith("tx already confirmed");
    });

    it("should prevent revoking confirmation of an already revoked transaction", async () => {
        const recipient = owners[1].address;
        const value = ethers.utils.parseEther("1.0");
        const data = "0x";

        await multiSigWallet.connect(owners[0]).submitTransaction(recipient, value, data);
        await multiSigWallet.connect(owners[1]).confirmTransaction(0);
        await multiSigWallet.connect(owners[1]).revokeConfirmation(0);

        await expect(multiSigWallet.connect(owners[1]).revokeConfirmation(0))
            .to.be.revertedWith("tx not confirmed");
    });

    it("should prevent executing a non-existing transaction", async () => {
        await expect(multiSigWallet.connect(owners[0]).executeTransaction(0))
            .to.be.revertedWith("tx does not exist");
    });

    it("should prevent revoking confirmation if not confirmed", async () => {
        await expect(multiSigWallet.connect(owners[0]).revokeConfirmation(0))
            .to.be.revertedWith("tx does not exist");
    });

    it("should return correct list of owners", async () => {
        const contractOwners = await multiSigWallet.getOwners();
        const expectedOwners = owners.map((owner) => owner.address);
        expect(contractOwners).to.deep.equal(expectedOwners);
    });
});
