const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EvidenceRegistry Contract", function () {
  let registry;
  let owner, addr1;
  const sampleEvidenceId = "ev_1001";
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("test_evidence_content"));
  const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("tampered_content"));

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
    registry = await EvidenceRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("Should register evidence successfully", async function () {
    await expect(registry.registerEvidence(sampleEvidenceId, sampleHash))
      .to.emit(registry, "EvidenceRegistered");

    const record = await registry.getRecord(sampleEvidenceId);
    expect(record.evidenceId).to.equal(sampleEvidenceId);
    expect(record.evidenceHash).to.equal(sampleHash);
  });

  it("Should revert on duplicate evidence registration", async function () {
    await registry.registerEvidence(sampleEvidenceId, sampleHash);
    await expect(registry.registerEvidence(sampleEvidenceId, sampleHash))
      .to.be.revertedWith("Evidence already registered");
  });

  it("Should verify true for valid hash and false for tampered hash", async function () {
    await registry.registerEvidence(sampleEvidenceId, sampleHash);
    
    const isVerifiedTrue = await registry.verifyEvidence(sampleEvidenceId, sampleHash);
    expect(isVerifiedTrue).to.be.true;

    const isVerifiedFalse = await registry.verifyEvidence(sampleEvidenceId, tamperedHash);
    expect(isVerifiedFalse).to.be.false;
  });

  it("Should record actions for registered evidence and revert for unregistered", async function () {
    await registry.registerEvidence(sampleEvidenceId, sampleHash);

    await expect(registry.recordAction(sampleEvidenceId, "accessed"))
      .to.emit(registry, "ActionRecorded")
      .withArgs(sampleEvidenceId, "accessed", owner.address, (val) => val > 0);

    await expect(registry.recordAction("unregistered_ev", "accessed"))
      .to.be.revertedWith("Evidence not registered");
  });
});
