// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceRegistry {
    struct EvidenceRecord {
        string evidenceId;
        bytes32 evidenceHash;
        uint256 timestamp;
        address investigator;
    }

    struct ActionRecord {
        string evidenceId;
        string action;
        address actor;
        uint256 timestamp;
    }

    mapping(string => EvidenceRecord) public records;
    ActionRecord[] public actionLog;

    event EvidenceRegistered(string evidenceId, bytes32 evidenceHash, address investigator, uint256 timestamp);
    event ActionRecorded(string evidenceId, string action, address actor, uint256 timestamp);

    function registerEvidence(string memory evidenceId, bytes32 evidenceHash) public {
        require(records[evidenceId].timestamp == 0, "Evidence already registered");
        records[evidenceId] = EvidenceRecord(evidenceId, evidenceHash, block.timestamp, msg.sender);
        emit EvidenceRegistered(evidenceId, evidenceHash, msg.sender, block.timestamp);
        actionLog.push(ActionRecord(evidenceId, "created", msg.sender, block.timestamp));
    }

    function recordAction(string memory evidenceId, string memory action) public {
        require(records[evidenceId].timestamp != 0, "Evidence not registered");
        actionLog.push(ActionRecord(evidenceId, action, msg.sender, block.timestamp));
        emit ActionRecorded(evidenceId, action, msg.sender, block.timestamp);
    }

    function verifyEvidence(string memory evidenceId, bytes32 currentHash) public view returns (bool) {
        return records[evidenceId].evidenceHash == currentHash;
    }

    function getRecord(string memory evidenceId) public view returns (EvidenceRecord memory) {
        return records[evidenceId];
    }
}
