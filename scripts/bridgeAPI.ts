import { ethers } from "hardhat";
import { BridgeETH, BridgeBSC } from "../typechain-types"; // Use TypeChain types

async function main() {
    const providerEth = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const providerBsc = new ethers.JsonRpcProvider("http://127.0.0.1:8546");

    const signers = await ethers.getSigners();
    const admin = signers[0];

    const bridgeEthAddress = "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE";
    const bridgeBscAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";

    const BridgeEthFactory = await ethers.getContractFactory("BridgeETH");
    const BridgeBscFactory = await ethers.getContractFactory("BridgeBSC");

    // ✅ Explicitly use providerEth for Ethereum
    const bridgeEth = BridgeEthFactory.attach(bridgeEthAddress).connect(await providerEth.getSigner(admin.address)) as BridgeETH;
    // ✅ Explicitly use providerBsc for Binance Smart Chain
    const bridgeBsc = BridgeBscFactory.attach(bridgeBscAddress).connect(await providerBsc.getSigner(admin.address)) as BridgeBSC;

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
    
        try {
            const amountParsed = BigInt(amount);
            const nonceParsed = Number(nonce);
            console.log(`📌 Minting ${amountParsed} tokens to ${to} on BSC...`);
            const tx = await bridgeBsc.mint(from, to, amountParsed, nonceParsed, signature);
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