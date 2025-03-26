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

    // Update token admin
    await tokenEth.updateAdmin(bridgeEthAddress);
    console.log(`TokenEth admin updated to: ${bridgeEthAddress}`);

    
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});