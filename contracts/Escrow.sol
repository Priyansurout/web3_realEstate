//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

interface IERC271 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public nftAddress;
    address public lender;
    address public inspector;
    address payable public seller;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    modifier OnlySeller() {
        require(msg.sender == seller, "Only seller can list");
        _;
    }

    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only seller can list");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    constructor(
        address _nftAddress,
        address payable _seller,
        address _lender,
        address _inspector
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        lender = _lender;
        inspector = _inspector;
    }

    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable OnlySeller {
        IERC271(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }
    // Function to transfer token from escrow to another address
    // function transferToken(address to, uint256 tokenId) public {
    //     IERC271(nftAddress).transferFrom(address(this), to, tokenId);
    // }

    // Put Under Contract (only buyer - payable escrow)

    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(escrowAmount[_nftID] > 0, "Escrow amount not set for this NFT");

        // Ensure that the sent value is at least the required escrow amount
        require(msg.value >= escrowAmount[_nftID], "Insufficient earnest money");
    }

    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector {
            inspectionPassed[_nftID] = _passed;
    }

    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }


    // Finalize Sale
    // -> Require inspection status (add more items here, like appraisal)
    // -> Require sale to be authorized
    // -> Require funds to be correct amount
    // -> Transfer NFT to buyer
    // -> Transfer Funds to Seller

    function finalizeSale(uint256 _nftID) public {
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][lender]);

        require(address(this).balance >= purchasePrice[_nftID]);

        isListed[_nftID] = false;

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success,"Transfer failed.");
        IERC271(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
        
        
    }

    // // Cancel Sale (handle earnest deposit)
    // -> if inspection status is not approved, then refund, otherwise send to seller

    function cancelSale(uint256 _nftID) public {

        if (inspectionPassed[_nftID] == false) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        }else {
            payable(seller).transfer(address(this).balance);
        }
    }

    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
