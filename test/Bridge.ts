import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { TokenETH, BridgeETH } from "../typechain-types";

describe("TokenETH and BridgeETH Deployment and Operations", function () {
    let deployer: SignerWithAddress;
    let owner2: SignerWithAddress;
    let owner3: SignerWithAddress;
    let user: SignerWithAddress;
    let tokenEth: TokenETH;
    let bridgeEth: BridgeETH;
    let tokenEthAddress: string;
    let bridgeEthAddress: string;

    beforeEach(async function () {
        [deployer, owner2, owner3, user] = await ethers.getSigners();

        const TokenEthFactory = await ethers.getContractFactory("TokenETH");
        tokenEth = await TokenEthFactory.deploy();
        await tokenEth.waitForDeployment();
        tokenEthAddress = await tokenEth.getAddress();

        const owners = [deployer.address, owner2.address, owner3.address];
        const requiredSignatures = 2;
        const BridgeEthFactory = await ethers.getContractFactory("BridgeETH");
        bridgeEth = await BridgeEthFactory.deploy(tokenEthAddress, owners, requiredSignatures);
        await bridgeEth.waitForDeployment();
        bridgeEthAddress = await bridgeEth.getAddress();
    });

    it("should deploy TokenETH and BridgeETH correctly", async function () {
        expect(tokenEthAddress).to.be.properAddress;
        expect(bridgeEthAddress).to.be.properAddress;

        const admin = await tokenEth.admin();
        expect(admin).to.equal(deployer.address);

        const bridgeOwners = await bridgeEth.owners(0);
        expect(bridgeOwners).to.equal(deployer.address);
        expect(await bridgeEth.requiredSignatures()).to.equal(2n);
    });

    it("should mint 1000 TokenETH to deployer", async function () {
        const mintAmount = ethers.parseUnits("1000", 18);
        await tokenEth.mint(deployer.address, mintAmount);
        const balance = await tokenEth.balanceOf(deployer.address);
        expect(balance).to.equal(mintAmount);
    });

    it("should deposit 2 ETH into the bridge via depositEth and update balance", async function () {
        const depositAmount = ethers.parseEther("2");
        const initialBridgeBalance = await ethers.provider.getBalance(bridgeEthAddress);
        expect(initialBridgeBalance).to.equal(0n);

        const tx = await bridgeEth.depositEth({ value: depositAmount });
        await tx.wait();

        const newBridgeBalance = await ethers.provider.getBalance(bridgeEthAddress);
        expect(newBridgeBalance).to.equal(depositAmount);

        await expect(tx).to.emit(bridgeEth, "EthDeposited").withArgs(deployer.address, depositAmount);
    });

    it("should deposit 1 ETH via receive() and update balance", async function () {
        const depositAmount = ethers.parseEther("1");
        const initialBridgeBalance = await ethers.provider.getBalance(bridgeEthAddress);
        expect(initialBridgeBalance).to.equal(0n);

        const tx = await deployer.sendTransaction({
            to: bridgeEthAddress,
            value: depositAmount,
        });
        await tx.wait();

        const newBridgeBalance = await ethers.provider.getBalance(bridgeEthAddress);
        expect(newBridgeBalance).to.equal(depositAmount);

        await expect(tx).to.emit(bridgeEth, "EthDeposited").withArgs(deployer.address, depositAmount);
    });

    it("should withdraw 0.5 ETH from the bridge with signatures", async function () {
        const depositAmount = ethers.parseEther("2");
        const withdrawAmount = ethers.parseEther("0.5");
        const nonce = 1;

        await bridgeEth.depositEth({ value: depositAmount });
        const initialBridgeBalance = await ethers.provider.getBalance(bridgeEthAddress);
        expect(initialBridgeBalance).to.equal(depositAmount);

        // Correct encoding format
        const packedMessage = ethers.solidityPackedKeccak256(
            ["string", "address", "uint256", "uint256", "address"],
            ["transferEth", deployer.address, withdrawAmount, nonce, bridgeEthAddress]
        );

        const sig1 = await deployer.signMessage(ethers.getBytes(packedMessage));
        const sig2 = await owner2.signMessage(ethers.getBytes(packedMessage));
        const signatures = [sig1, sig2];

        const initialDeployerBalance = await ethers.provider.getBalance(deployer.address);
        const withdrawTx = await bridgeEth.transferEth(deployer.address, withdrawAmount, nonce, signatures);
        const receipt = await withdrawTx.wait();

        if (!receipt) {
            throw new Error("Transaction receipt is null");
        }

        const gasUsed = receipt.gasUsed;
        const gasPrice = withdrawTx.maxFeePerGas ?? withdrawTx.gasPrice ?? BigInt(0);
        const gasCost = gasUsed * gasPrice;

        const finalBridgeBalance = await ethers.provider.getBalance(bridgeEthAddress);
        const finalDeployerBalance = await ethers.provider.getBalance(deployer.address);

        expect(finalBridgeBalance).to.equal(depositAmount - withdrawAmount);
        expect(finalDeployerBalance).to.be.closeTo(
            initialDeployerBalance + withdrawAmount - gasCost,
            ethers.parseEther("0.01")
        );

        await expect(withdrawTx)
            .to.emit(bridgeEth, "EthSent")
            .withArgs(deployer.address, deployer.address, withdrawAmount);
    });

    it("should fail to withdraw without enough signatures", async function () {
        const depositAmount = ethers.parseEther("2");
        const withdrawAmount = ethers.parseEther("0.5");
        const nonce = 1;

        await bridgeEth.depositEth({ value: depositAmount });

        const abiCoder = new ethers.AbiCoder();
        const packedMessage = ethers.keccak256(
            ethers.concat([
                ethers.toUtf8Bytes("transferEth"),
                abiCoder.encode(["address"], [deployer.address]),
                abiCoder.encode(["uint256"], [withdrawAmount]),
                abiCoder.encode(["uint256"], [nonce]),
                abiCoder.encode(["address"], [bridgeEthAddress])
            ])
        );
        const sig1 = await deployer.signMessage(ethers.getBytes(packedMessage));
        const signatures = [sig1];

        await expect(
            bridgeEth.transferEth(deployer.address, withdrawAmount, nonce, signatures)
        ).to.be.revertedWith("Insufficient signatures");
    });

    it("should mint tokens with signatures and send gas fee", async function () {
        const depositAmount = ethers.parseEther("2");
        const mintAmount = ethers.parseUnits("100", 18);
        const nonce = 1;
        const gasFee = ethers.parseEther("0.1");

        await bridgeEth.depositEth({ value: depositAmount });
        await tokenEth.updateAdmin(bridgeEthAddress);

        // Correct encoding
        const userPackedMessage = ethers.solidityPackedKeccak256(
            ["address", "address", "uint256", "uint256"],
            [user.address, deployer.address, mintAmount, nonce]
        );
        const userSig = await user.signMessage(ethers.getBytes(userPackedMessage));

        const ownerPackedMessage = ethers.solidityPackedKeccak256(
            ["string", "address", "address", "uint256", "uint256", "address"],
            ["mint", user.address, deployer.address, mintAmount, nonce, bridgeEthAddress]
        );
        
        const sig1 = await deployer.signMessage(ethers.getBytes(ownerPackedMessage));
        const sig2 = await owner2.signMessage(ethers.getBytes(ownerPackedMessage));
        const ownerSigs = [sig1, sig2];

        const initialBalance = await tokenEth.balanceOf(deployer.address);
        const initialDeployerEth = await ethers.provider.getBalance(deployer.address);

        const tx = await bridgeEth.mint(user.address, deployer.address, mintAmount, nonce, userSig, ownerSigs);
        const receipt = await tx.wait();

        if (!receipt) throw new Error("Transaction receipt is null");

        const gasPrice = tx.maxFeePerGas ?? tx.gasPrice ?? BigInt(0);
        const gasCost = receipt.gasUsed * gasPrice;

        const finalBalance = await tokenEth.balanceOf(deployer.address);
        const finalDeployerEth = await ethers.provider.getBalance(deployer.address);
        const finalBridgeEth = await ethers.provider.getBalance(bridgeEthAddress);

        expect(finalBalance).to.equal(initialBalance + mintAmount);
        expect(finalDeployerEth).to.be.closeTo(initialDeployerEth + gasFee - gasCost, ethers.parseEther("0.01"));
        expect(finalBridgeEth).to.equal(depositAmount - gasFee);

        const events = await bridgeEth.queryFilter(bridgeEth.filters.Transfer(), receipt.blockNumber);
        expect(events.length).to.equal(1);
        const eventArgs = events[0].args;

        expect(eventArgs.from).to.equal(user.address);
        expect(eventArgs.to).to.equal(deployer.address);
        expect(eventArgs.amount).to.equal(mintAmount);
        expect(eventArgs.nonce).to.equal(nonce);
        expect(eventArgs.signature).to.equal(userSig);
        expect(eventArgs.step).to.equal(1);
        expect(eventArgs.date).to.be.a("bigint").and.to.be.greaterThan(0n);
    });

    it("should burn tokens", async function () {
        const mintAmount = ethers.parseUnits("100", 18);
        const burnAmount = ethers.parseUnits("50", 18);
        const nonce = 1;
    
        await tokenEth.mint(deployer.address, mintAmount);
        
        await tokenEth.updateAdmin(bridgeEthAddress);
    
        const packedMessage = ethers.solidityPackedKeccak256(
            ["address", "address", "uint256", "uint256"],
            [deployer.address, user.address, burnAmount, nonce]
        );
        const signature = await deployer.signMessage(ethers.getBytes(packedMessage));
    
        const initialBalance = await tokenEth.balanceOf(deployer.address);
    
        // Burn tokens through the bridge
        const tx = await bridgeEth.connect(deployer).burn(user.address, burnAmount, nonce, signature);
        const receipt = await tx.wait();
        if (!receipt) throw new Error("Transaction receipt is null");
    
        // Check final balances
        const finalBalance = await tokenEth.balanceOf(deployer.address);
        expect(finalBalance).to.equal(initialBalance - burnAmount);
    
        // Verify emitted event
        const events = await bridgeEth.queryFilter(bridgeEth.filters.Transfer(), receipt.blockNumber);
        expect(events.length).to.equal(1);
        const eventArgs = events[0].args;
    
        expect(eventArgs.from).to.equal(deployer.address);
        expect(eventArgs.to).to.equal(user.address);
        expect(eventArgs.amount).to.equal(burnAmount);
        expect(eventArgs.nonce).to.equal(nonce);
        expect(eventArgs.signature).to.equal(signature);
        expect(eventArgs.step).to.equal(0); // Step.Burn
        expect(eventArgs.date).to.be.a("bigint").and.to.be.greaterThan(0n);
    });

    it("should fail to withdraw more ETH than deposited", async function () {
        const depositAmount = ethers.parseEther("2");
        const withdrawAmount = ethers.parseEther("3");
        const nonce = 1;

        await bridgeEth.depositEth({ value: depositAmount });

        const abiCoder = new ethers.AbiCoder();
        const packedMessage = ethers.keccak256(
            ethers.concat([
                ethers.toUtf8Bytes("transferEth"),
                abiCoder.encode(["address"], [deployer.address]),
                abiCoder.encode(["uint256"], [withdrawAmount]),
                abiCoder.encode(["uint256"], [nonce]),
                abiCoder.encode(["address"], [bridgeEthAddress])
            ])
        );
        const sig1 = await deployer.signMessage(ethers.getBytes(packedMessage));
        const sig2 = await owner2.signMessage(ethers.getBytes(packedMessage));
        const signatures = [sig1, sig2];

        await expect(
            bridgeEth.transferEth(deployer.address, withdrawAmount, nonce, signatures)
        ).to.be.revertedWith("Insufficient ETH balance");
    });

    it("should update TokenETH admin to BridgeETH address", async function () {
        await tokenEth.updateAdmin(bridgeEthAddress);
        const newAdmin = await tokenEth.admin();
        expect(newAdmin).to.equal(bridgeEthAddress);
    });
});