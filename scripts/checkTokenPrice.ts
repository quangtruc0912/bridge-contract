import { ethers } from "hardhat";

async function main() {
    // Configuration
    const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
    const bridgeAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 
    const deployerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; 


    let bridgeBalance = await ethers.provider.getBalance(bridgeAddress);
    console.log('Bridge BSC Balance:', ethers.formatEther(bridgeBalance))


    let deployerBalance = await ethers.provider.getBalance(deployerAddress);
    console.log('Deployer balance : ', ethers.formatEther(deployerBalance));

    const tokenContract = await ethers.getContractAt("TokenBSC", tokenAddress);
    console.log(`Connected to TokenBSC at: ${tokenAddress}`);
    const deployerTokenBalance = await tokenContract.balanceOf(deployerAddress);
    console.log('Deployer Custom Token balance : ', ethers.formatEther(deployerTokenBalance));
    
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});