const { expect } = require("chai");
const { ethers } = require('hardhat')


const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe( "RealEstate Contract", function () {

    let RealEstate;
    let realEstate;
    let Escrow ;
    let escrow;
    let seller;
    let buyer;
    let inspector;
    let lender;


    beforeEach(async function() {
        [seller, buyer, inspector, lender] = await ethers.getSigners();
        //console.log(`seller: ${seller.address}`) 
        // console.log(`buyer: ${buyer.address}`) 
        // console.log(`inspector: ${inspector.address}`) 
        // console.log(`lender: ${lender.address}`) 


        RealEstate = await ethers.getContractFactory("RealEstate");
        realEstate = await RealEstate.deploy();
        await realEstate.deployed();
        //console.log(`RealEstate address: ${JSON.stringify(realEstate.address)}`)

        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");
        await transaction.wait();
        //console.log(`transaction ${JSON.stringify(transaction)}`);
        //console.log(`totalSupply ${ await realEstate.totalSuuply()}`)
        expect(await realEstate.totalSuuply()).to.equal(1);


        Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy(realEstate.address, seller.address,lender.address,inspector.address);
        await escrow.deployed();

       // console.log(`Escrow address: ${escrow.address}`)
       // console.log(`NFT address is: ${JSON.stringify(await escrow.nftAddress())}`)
       // expect(await escrow.nftAddress()).to.equal(realEstate.address)

        // console.log("----------------------------------------------------------------------");
        // console.log(" ");
        

        // Aproval here the seller approve the escrow for nft transfer
        transaction = await realEstate.connect(seller).approve(escrow.address, 1);
        await transaction.wait();

        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(100), tokens(10));
        await transaction.wait();


    })
    
    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        it('Returns seller', async () => {
            const result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })

        it('Returns inspector', async () => {
            const result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        it('Returns lender', async () => {
            const result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('listing', () => {

        it('Updates as listed', async () => {
            const result = await escrow.isListed(1)
            expect(result).to.be.equal(true)
        })

        it('Returns buyer', async () => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        it('Returns purchase price', async () => {
            const result = await escrow.purchasePrice(1)
            expect(result).to.be.equal(tokens(100))
        })

        it('Returns escrow amount', async () => {
            const result = await escrow.escrowAmount(1)
            expect(result).to.be.equal(tokens(10))
        })
        
        it('update the ownsership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })
    })


    describe("Deposits", () => {
        beforeEach( async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(1,{value : tokens(10)});
            await transaction.wait();
        })

        it('Updates contract balance',async () => {
            const result = await escrow.getBalance();
            expect(result).to.be.equal(tokens(10))
        })
    })

    describe("Inspection", () => {
        beforeEach( async () => {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1,true);
            await transaction.wait();
        })


        it('Updates inspection status',async () => {
            const result = await escrow.inspectionPassed(1);
            expect(result).to.be.equal(true)
        })
    })

    describe('Approval', () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()
        })

        it('Updates approval status', async () => {
            expect(await escrow.approval(1, buyer.address)).to.be.equal(true)
            expect(await escrow.approval(1, seller.address)).to.be.equal(true)
            expect(await escrow.approval(1, lender.address)).to.be.equal(true)
        })
    })

    describe('Sale', () => {

        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(10)});
            await transaction.wait();

            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();

            transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();

            await lender.sendTransaction({to: escrow.address, value: tokens(90)});

            transaction = await escrow.connect(seller).finalizeSale(1);
            await transaction.wait();
        })

        it('Updates ownership', async () => { 
            expect(await realEstate.ownerOf(1)).to.be.equals(buyer.address);
        })

        it('Updates balance', async () => {
            expect(await escrow.getBalance()).to.be.equal(0);
        })
    })

}
)