const hre = require("hardhat");

async function main() {

    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    // Deploy Token
    const TokenEth = await hre.ethers.getContractFactory("TokenETH");
    const tokenEth = await TokenEth.deploy();
    await tokenEth.waitForDeployment();
    const tokenEthAddress = await tokenEth.getAddress();
    console.log("TokenEth deployed at:", tokenEthAddress);

    // Mint tokens
    await tokenEth.mint(deployer.address, hre.ethers.parseUnits("1000", 18));
    console.log(`Minted 1000 TokenEth to: ${deployer.address}`);

    // Deploy Bridge
    const BridgeEth = await hre.ethers.getContractFactory("BridgeETH");
    const bridgeEth = await BridgeEth.deploy(tokenEthAddress);
    await bridgeEth.waitForDeployment();
    const bridgeEthAddress = await bridgeEth.getAddress();
    console.log("BridgeEth deployed at:", bridgeEthAddress);

    // Get Contract Instances
    const bridgeContract = await hre.ethers.getContractAt("BridgeETH", bridgeEthAddress);

    console.log("\n Depositing 2 ETH into the bridge...");
    const depositTx = await bridgeContract.depositEth({ value: hre.ethers.parseEther("2") });
    await depositTx.wait();
    console.log(" Deposited 2 ETH into the bridge");

    // 2️⃣ Check Bridge ETH Balance
    let bridgeBalance = await hre.ethers.provider.getBalance(bridgeEthAddress);
    console.log(`\n Bridge ETH Balance: ${hre.ethers.formatEther(bridgeBalance)} ETH`);

    // 3️⃣ Withdraw ETH from Bridge (by Admin)
    console.log("\n Withdrawing 0.5 ETH from the bridge...");
    const withdrawTx = await bridgeContract.withdrawEth(deployer.address, hre.ethers.parseEther("0.5"));
    await withdrawTx.wait();
    console.log(`\n Withdrawn 0.5 ETH to admin: ${deployer.address}`);

    // 4️⃣ Check Bridge ETH Balance Again
    bridgeBalance = await hre.ethers.provider.getBalance(bridgeEthAddress);
    console.log(`\n Bridge ETH Balance After Withdrawal: ${hre.ethers.formatEther(bridgeBalance)} ETH`);

    // Update token admin
    await tokenEth.updateAdmin(bridgeEthAddress);
    console.log(`TokenEth admin updated to: ${bridgeEthAddress}`);


}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});