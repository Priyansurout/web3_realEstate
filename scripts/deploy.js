const {ethers} = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}


async function main() {
    // Setup accounts
    const [seller, buyer, inspector, lender] = await ethers.getSigners();

    // Deploy Real Estate
    const RealEstate = await ethers.getContractFactory('RealEstate');
    const realEstate = await RealEstate.deploy();
    await realEstate.deployed();
    console.log('address of realestate is: ', realEstate.address)
    console.log(`Minting 3 properties...\n`)

    for (let i=0; i<3; i++){
        const transaction = await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`);
        await transaction.wait();
    }



   // Deploy Esrow

    const Escrow = await ethers.getContractFactory('Escrow');
    const escrow = await Escrow.deploy(realEstate.address, seller.address, lender.address, inspector.address);
    await escrow.deployed();
    console.log('address of esrow is: ', escrow.address)
    console.log(`Listing 3 properties...\n`)


    //   // Approve properties...
    for (let i=1; i<=3; i++){
        let transaction = await realEstate.connect(seller).approve(escrow.address, i);
        await transaction.wait();
    }

    //// Listing properties...
   
    transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
    await transaction.wait()

    transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
    await transaction.wait()

    transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
    await transaction.wait()

    console.log(`Finished.`)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });