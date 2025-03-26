import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contract with address:", deployer.address);
    
    const CounterContract = await ethers.getContractFactory("Counter", deployer);
    const counterInstance = await CounterContract.deploy();
    
    await counterInstance.waitForDeployment(); // Ensure deployment
    
    console.log('Counter contract deployed to:', await counterInstance.getAddress());
    
    await counterInstance.incrementByNumber(5);
    console.log('Incremented by 5');

    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for tx

    console.log('Counter value:', Number(await counterInstance.getCounter()));

    await counterInstance.decrementByOne();
    console.log('Counter value:', Number(await counterInstance.getCounter()));

    await counterInstance.incrementByNumber(10);
    console.log('Incremented by 10');
    console.log('Counter value:', Number(await counterInstance.getCounter()));
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
