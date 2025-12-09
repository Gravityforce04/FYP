// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * RoboticsCompetition
 * - Stores verified match results on-chain
 * - No NFT minting logic (handled by separate NFT & Marketplace contracts)
 */
contract RoboticsCompetition is Ownable {
    
    struct MatchResult {
        uint256 matchId;
        address winner;
        address[] participants;
        uint256 timestamp;
        string matchData;
        bool verified;
    }
    
    // Incremental counter for convenience if you want to auto-assign ids off-chain
    mapping(uint256 => MatchResult) public matchResults;
    
    event MatchResultRecorded(uint256 indexed matchId, address indexed winner);
    
    constructor() Ownable(msg.sender) {}
    
    function recordMatchResult(
        uint256 _matchId,
        address _winner,
        address[] memory _participants,
        string memory _matchData
    ) external {
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
}