const { ethers } = require("hardhat");

async function main() {
    //  Get deployer
    const [deployer, owner2, owner3] = await ethers.getSigners(); // Add more signers for multisig
    console.log(`Deploying contracts with account: ${deployer.address}`);

    //  Deploy TokenETH
    const TokenEth = await ethers.getContractFactory("TokenETH");
    const tokenEth = await TokenEth.deploy();
    await tokenEth.waitForDeployment();
    const tokenEthAddress = await tokenEth.getAddress();
    console.log("TokenEth deployed at:", tokenEthAddress);

    // Mint tokens
    await tokenEth.mint(deployer.address, ethers.parseUnits("1000", 18));
    console.log(`Minted 1000 TokenEth to: ${deployer.address}`);

    //  Deploy BridgeETH with multisig owners
    const owners = [deployer.address, owner2.address, owner3.address];
    const requiredSignatures = 2; // 2-of-3 multisig
    const BridgeEth = await ethers.getContractFactory("BridgeETH");
    const bridgeEth = await BridgeEth.deploy(tokenEthAddress, owners, requiredSignatures);
    await bridgeEth.waitForDeployment();
    const bridgeEthAddress = await bridgeEth.getAddress();
    console.log("BridgeEth deployed at:", bridgeEthAddress);

    // Get contract instance
    const bridgeContract = await ethers.getContractAt("BridgeETH", bridgeEthAddress);

    // Deposit 2 ETH into the bridge
    console.log("\nDepositing 2 ETH into the bridge...");
    const depositTx = await bridgeContract.depositEth({ value: ethers.parseEther("2") });
    await depositTx.wait();
    console.log("Deposited 2 ETH into the bridge");

    // Check bridge ETH balance
    let bridgeBalance = await ethers.provider.getBalance(bridgeEthAddress);
    console.log(`Bridge ETH Balance: ${ethers.formatEther(bridgeBalance)} ETH`);

    // Withdraw 0.5 ETH with off-chain signatures
    console.log("\nWithdrawing 0.5 ETH from the bridge...");
    const nonce = 1; // Unique nonce for this transfer
    const amount = ethers.parseEther("0.5");
    const packedMessage = ethers.solidityPackedKeccak256(
        ["string", "address", "uint256", "uint256", "address"],
        ["transferEth", deployer.address, amount, nonce, bridgeEthAddress]
    );

    // Sign the message with 2 owners
    const sig1 = await deployer.signMessage(ethers.getBytes(packedMessage));
    const sig2 = await owner2.signMessage(ethers.getBytes(packedMessage));
    const signatures = [sig1, sig2];

    // Call transferEth with signatures
    const withdrawTx = await bridgeContract.transferEth(deployer.address, amount, nonce, signatures);
    await withdrawTx.wait();
    console.log(`Withdrawn 0.5 ETH to: ${deployer.address}`);

    // 6️⃣ Check balances again
    bridgeBalance = await ethers.provider.getBalance(bridgeEthAddress);
    console.log(`Bridge ETH Balance After Withdrawal: ${ethers.formatEther(bridgeBalance)} ETH`);

    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer ETH Balance After Withdrawal: ${ethers.formatEther(deployerBalance)} ETH`);

    // 7️⃣ Update token admin
    await tokenEth.updateAdmin(bridgeEthAddress);
    console.log(`TokenEth admin updated to: ${bridgeEthAddress}`);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});