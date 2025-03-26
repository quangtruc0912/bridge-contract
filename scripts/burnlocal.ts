import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Using account: ${deployer.address}`);
    
    const bridgeEthAddress = "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE";
    const bridgeEth = await ethers.getContractAt("BridgeETH", bridgeEthAddress);
    
    const amount = ethers.parseUnits("1000", 18); // Correctly formatted BigInt
    const nonce = 1; // Ensure this is unique for each transfer
    
    // Construct message hash (use BigInt directly, not string)
    const messageHash = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "uint256"],
        [deployer.address, deployer.address, amount, nonce] // ✅ Corrected BigInt usage
    );
    
    // Sign the raw hash (without converting to bytes)
    const signature = await deployer.signMessage(ethers.getBytes(messageHash));
    
    console.log(`Signature: ${signature}`);
    
    // Call burn function on BridgeEth contract
    const tx = await bridgeEth.burn(deployer.address, amount, nonce, signature);
    await tx.wait();
    
    console.log(`✅ Burn transaction successful! Tx Hash: ${tx.hash}`);
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});