// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {

    // Variables
    address payable public immutable feeAccount; // the account that receives fees
    uint public immutable feePercent; // the fee percentage on sales 
    uint public itemCount; 

    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
        bool listed; // Track if item is listed
    }

    // itemId -> Item
    mapping(uint => Item) public items;
    // seller -> itemIds[]
    mapping(address => uint[]) public sellerItems;

    event Listed(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );
    
    event Bought(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );

    event Unlisted(
        uint itemId,
        address indexed nft,
        uint tokenId,
        address indexed seller
    );

    constructor(uint _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    // List NFT without transferring (keeps NFT in wallet)
    function listNFT(IERC721 _nft, uint _tokenId, uint _price) external {
        require(_price > 0, "Price must be greater than zero");
        require(_nft.ownerOf(_tokenId) == msg.sender, "You don't own this NFT");
        
        itemCount++;
        
        items[itemCount] = Item(
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false,
            true
        );
        
        sellerItems[msg.sender].push(itemCount);
        
        emit Listed(
            itemCount,
            address(_nft),
            _tokenId,
            _price,
            msg.sender
        );
    }

    // Unlist NFT
    function unlistNFT(uint _itemId) external {
        Item storage item = items[_itemId];
        require(item.seller == msg.sender, "Not your item");
        require(item.listed && !item.sold, "Item not listed or already sold");
        
        item.listed = false;
        
        emit Unlisted(
            _itemId,
            address(item.nft),
            item.tokenId,
            msg.sender
        );
    }

    // Purchase listed NFT
    function purchaseNFT(uint _itemId) external payable nonReentrant {
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "Item doesn't exist");
        require(item.listed && !item.sold, "Item not listed or already sold");
        require(msg.value >= item.price, "Insufficient payment");
        
        uint totalPrice = getTotalPrice(_itemId);
        require(msg.value >= totalPrice, "Insufficient payment for price + fees");
        
        // Transfer NFT from seller to buyer
        item.nft.transferFrom(item.seller, msg.sender, item.tokenId);
        
        // Pay seller and fees
        item.seller.transfer(item.price);
        feeAccount.transfer(totalPrice - item.price);
        
        // Update item status
        item.sold = true;
        item.listed = false;
        
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }

    // Get items listed by a specific seller
    function getSellerItems(address _seller) external view returns (uint[] memory) {
        return sellerItems[_seller];
    }

    // Get all listed items
    function getAllListedItems() external view returns (uint[] memory) {
        uint[] memory listedItems = new uint[](itemCount);
        uint count = 0;
        
        for (uint i = 1; i <= itemCount; i++) {
            if (items[i].listed && !items[i].sold) {
                listedItems[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        assembly {
            mstore(listedItems, count)
        }
        
        return listedItems;
    }

    function getTotalPrice(uint _itemId) view public returns(uint) {
        return ((items[_itemId].price * (100 + feePercent)) / 100);
    }
}
