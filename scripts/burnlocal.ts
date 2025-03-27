import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Using account: ${deployer.address}`);
    
    const bridgeEthAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const bridgeEth = await ethers.getContractAt("BridgeETH", bridgeEthAddress);
    
    const amount = ethers.parseUnits("1000", 18); 
    const nonce = 2; 
    
    // Construct message hash (use BigInt directly, not string)
    const messageHash = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "uint256"],
        [deployer.address, deployer.address, amount, nonce] // Corrected BigInt usage
    );
    
    // Sign the raw hash (without converting to bytes)
    const signature = await deployer.signMessage(ethers.getBytes(messageHash));
    
    console.log(`Signature: ${signature}`);
    
    // Call burn function on BridgeEth contract
    const tx = await bridgeEth.burn(deployer.address, amount, nonce, signature);
    await tx.wait();
    
    console.log(`Burn transaction successful! Tx Hash: ${tx.hash}`);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});