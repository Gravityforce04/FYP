// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTMarketplace is ReentrancyGuard {
    using Counters for Counters.Counter;
    
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }
    
    Counters.Counter private _listingIds;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public tokenToListingId;
    
    event NFTListed(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed listingId, uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    
    function listNFT(uint256 _tokenId, uint256 _price) external {
        require(_price > 0, "Price must be greater than 0");
        
        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        
        listings[listingId] = Listing({
            tokenId: _tokenId,
            seller: msg.sender,
            price: _price,
            active: true
        });
        
        tokenToListingId[_tokenId] = listingId;
        
        emit NFTListed(listingId, _tokenId, msg.sender, _price);
    }
    
    function buyNFT(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 tokenId = listing.tokenId;
        
        // Transfer NFT to buyer
        IERC721(0x5FbDB2315678afecb367f032d93F642f64180aa3).transferFrom(seller, msg.sender, tokenId);
        
        // Transfer payment to seller
        payable(seller).transfer(msg.value);
        
        // Update listing
        listing.active = false;
        delete tokenToListingId[tokenId];
        
        emit NFTSold(_listingId, tokenId, msg.sender, msg.value);
    }
    
    function cancelListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(msg.sender == listing.seller, "Not the seller");
        require(listing.active, "Listing not active");
        
        listing.active = false;
        delete tokenToListingId[listing.tokenId];
        
        emit ListingCancelled(_listingId);
    }
}