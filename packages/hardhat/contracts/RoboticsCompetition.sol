// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoboticsCompetition is ERC721, Ownable {
    
    struct MatchResult {
        uint256 matchId;
        address winner;
        address[] participants;
        uint256 timestamp;
        string matchData;
        bool verified;
    }
    
    struct NFTMetadata {
        uint256 matchId;
        string tokenURI;
        uint256 rarity;
        bool isWinnerNFT;
    }
    
    uint256 private _tokenIds;
    mapping(uint256 => MatchResult) public matchResults;
    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(address => uint256[]) public userNFTs;
    
    event MatchResultRecorded(uint256 indexed matchId, address indexed winner);
    event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 matchId);
    
    constructor() ERC721("Robotics Competition NFT", "RCNFT") Ownable(msg.sender) {}
    
    function recordMatchResult(
        uint256 _matchId,
        address _winner,
        address[] memory _participants,
        string memory _matchData
    ) external onlyOwner {
        require(matchResults[_matchId].matchId == 0, "Match already recorded");
        
        matchResults[_matchId] = MatchResult({
            matchId: _matchId,
            winner: _winner,
            participants: _participants,
            timestamp: block.timestamp,
            matchData: _matchData,
            verified: true
        });
        
        emit MatchResultRecorded(_matchId, _winner);
    }
    
    function mintWinnerNFT(uint256 _matchId) external {
        MatchResult memory result = matchResults[_matchId];
        require(result.verified, "Match not verified");
        require(msg.sender == result.winner, "Only winner can mint");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(msg.sender, newTokenId);
        
        nftMetadata[newTokenId] = NFTMetadata({
            matchId: _matchId,
            tokenURI: string(abi.encodePacked("ipfs://", _matchId)),
            rarity: 100, // Winner NFTs have highest rarity
            isWinnerNFT: true
        });
        
        userNFTs[msg.sender].push(newTokenId);
        emit NFTMinted(newTokenId, msg.sender, _matchId);
    }
    
    function mintParticipantNFT(uint256 _matchId) external {
        MatchResult memory result = matchResults[_matchId];
        require(result.verified, "Match not verified");
        require(isParticipant(msg.sender, _matchId), "Not a participant");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(msg.sender, newTokenId);
        
        nftMetadata[newTokenId] = NFTMetadata({
            matchId: _matchId,
            tokenURI: string(abi.encodePacked("ipfs://", _matchId)),
            rarity: 50, // Participant NFTs have medium rarity
            isWinnerNFT: false
        });
        
        userNFTs[msg.sender].push(newTokenId);
        emit NFTMinted(newTokenId, msg.sender, _matchId);
    }
    
    function isParticipant(address _user, uint256 _matchId) internal view returns (bool) {
        address[] memory participants = matchResults[_matchId].participants;
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == _user) return true;
        }
        return false;
    }
    
    function getMatchResult(uint256 _matchId) external view returns (MatchResult memory) {
        return matchResults[_matchId];
    }
    
    function getUserNFTs(address _user) external view returns (uint256[] memory) {
        return userNFTs[_user];
    }
}