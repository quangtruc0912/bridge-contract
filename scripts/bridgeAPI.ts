import { ethers } from "hardhat";
import { BridgeETH, BridgeBSC } from "../typechain-types"; // Use TypeChain types

async function main() {
    const providerEth = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const providerBsc = new ethers.JsonRpcProvider("http://127.0.0.1:8546");

    const [deployer, owner2, owner3] = await ethers.getSigners();

    console.log(owner2.address)
    console.log(owner3.address)

    const bridgeEthAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const bridgeBscAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    const BridgeEthFactory = await ethers.getContractFactory("BridgeETH");
    const BridgeBscFactory = await ethers.getContractFactory("BridgeBSC");

    // Explicitly use providerEth for Ethereum
    const bridgeEth = BridgeEthFactory.attach(bridgeEthAddress).connect(await providerEth.getSigner(deployer.address)) as BridgeETH;
    //Explicitly use providerBsc for Binance Smart Chain
    const bridgeBsc = BridgeBscFactory.attach(bridgeBscAddress).connect(await providerBsc.getSigner(deployer.address)) as BridgeBSC;

    console.log("✅ Listening for Transfer events on Ethereum...");

    bridgeEth.on(bridgeEth.filters.Transfer(), async (eventPayload :any) => {
        console.log("🔔 Transfer event detected!");
        console.log("Event Payload Type:", typeof eventPayload);
        console.log("Raw Event Payload:", eventPayload);
        console.log("Event Payload Keys:", Object.keys(eventPayload));
    
        let from, to, amount, date, nonce, signature, step;
    
        // Try to extract data based on possible structures
        if (eventPayload && eventPayload.args) {
            // Case 1: ContractEventPayload with args
            [from, to, amount, date, nonce, signature, step] = eventPayload.args;
            console.log("Using args:", eventPayload.args);
        } else if (eventPayload && eventPayload.topics && eventPayload.data) {
            // Case 2: Raw Log object
            const parsedLog = bridgeEth.interface.parseLog(eventPayload);
            if (parsedLog) {
                [from, to, amount, date, nonce, signature, step] = parsedLog.args;
                console.log("Parsed Log:", parsedLog);
            }
        } else {
            console.error("❌ Unknown event payload structure");
        }
    
        console.log("Extracted Params:", { from, to, amount, date, nonce, signature, step });
    
        if (!amount || !nonce) {
            console.error("❌ Error: Missing amount or nonce", { amount, nonce });
            return;
        }
        const amountParsed = BigInt(amount);
        const nonceParsed = BigInt(nonce);
        
        const ownerPackedMessage = ethers.keccak256(
            ethers.solidityPacked(
                ["string", "address", "address", "uint256", "uint256", "address"],
                ["mint", from, to, amountParsed, nonceParsed, bridgeBscAddress] // Use bridgeBscAddress
            )
        );
        
        console.log("Deployer address:", deployer.address);
        console.log("Owner2 address:", owner2.address);
        console.log("Message hash:", ownerPackedMessage);
        
        const sig1 = await owner2.signMessage(ethers.getBytes(ownerPackedMessage));
        const sig2 = await deployer.signMessage(ethers.getBytes(ownerPackedMessage));
        const ownerSigs = [sig1, sig2];
        
        console.log("Sig1 (owner2):", sig1);
        console.log("Sig2 (deployer):", sig2);
        
        console.log(`📌 Minting ${amountParsed} tokens to ${to} on BSC...`);
        try {
          
            const tx = await bridgeBsc.mint(from, to, amountParsed, nonceParsed, signature,ownerSigs);
            await tx.wait();
            console.log(`✅ Minted tokens on BSC! Tx Hash: ${tx.hash}`);
        } catch (error) {
            console.error("❌ Mint error:", error);
        }
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});