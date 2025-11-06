import { expect } from "chai";
import { ethers, fhevm, deployments } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TalkletReview } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("TalkletReview", function () {
  let talkletReview: TalkletReview;
  let talkletReviewAddress: string;
  let organizer: HardhatEthersSigner;
  let speaker: HardhatEthersSigner;
  let attendee1: HardhatEthersSigner;
  let attendee2: HardhatEthersSigner;
  let attendee3: HardhatEthersSigner;

  before(async function () {
    // Check if running on mock
    if (!fhevm.isMock) {
      console.warn("This test suite can only run on FHEVM mock environment");
      this.skip();
    }

    await deployments.fixture(["TalkletReview"]);
    const signers = await ethers.getSigners();
    [organizer, speaker, attendee1, attendee2, attendee3] = signers;

    const TalkletReviewDeployment = await deployments.get("TalkletReview");
    talkletReviewAddress = TalkletReviewDeployment.address;
    talkletReview = (await ethers.getContractAt(
      "TalkletReview",
      talkletReviewAddress
    )) as unknown as TalkletReview;

    console.log("TalkletReview contract deployed at:", talkletReviewAddress);
  });

  describe("Session Creation", function () {
    it("Should create a new session", async function () {
      const tx = await talkletReview
        .connect(organizer)
        .createSession("Advanced FHEVM Techniques", speaker.address, [attendee1.address, attendee2.address]);

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = talkletReview.interface.parseLog(log);
          return parsed?.name === "SessionCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const sessionCount = await talkletReview.getSessionCount();
      expect(sessionCount).to.equal(1n);
    });

    it("Should authorize initial attendees", async function () {
      const isAuth1 = await talkletReview.isAuthorized(0, attendee1.address);
      const isAuth2 = await talkletReview.isAuthorized(0, attendee2.address);
      const isAuth3 = await talkletReview.isAuthorized(0, attendee3.address);

      expect(isAuth1).to.be.true;
      expect(isAuth2).to.be.true;
      expect(isAuth3).to.be.false;
    });

    it("Should revert with empty title", async function () {
      await expect(
        talkletReview.connect(organizer).createSession("", speaker.address, [])
      ).to.be.revertedWith("Empty title");
    });

    it("Should revert with invalid speaker", async function () {
      await expect(
        talkletReview.connect(organizer).createSession("Test Session", ethers.ZeroAddress, [])
      ).to.be.revertedWith("Invalid speaker address");
    });
  });

  describe("Attendee Authorization", function () {
    it("Should allow organizer to authorize additional attendees", async function () {
      await talkletReview.connect(organizer).authorizeAttendees(0, [attendee3.address]);

      const isAuth = await talkletReview.isAuthorized(0, attendee3.address);
      expect(isAuth).to.be.true;
    });

    it("Should revert if non-organizer tries to authorize", async function () {
      await expect(
        talkletReview.connect(attendee1).authorizeAttendees(0, [attendee2.address])
      ).to.be.revertedWith("Not organizer");
    });
  });

  describe("Review Submission", function () {
    it("Should allow authorized attendee to submit review", async function () {
      const clarity = 8;
      const innovation = 9;
      const inspiration = 7;

      // Encrypt clarity
      const encryptedClarity = await fhevm
        .createEncryptedInput(talkletReviewAddress, attendee1.address)
        .add16(clarity)
        .encrypt();

      // Encrypt innovation
      const encryptedInnovation = await fhevm
        .createEncryptedInput(talkletReviewAddress, attendee1.address)
        .add16(innovation)
        .encrypt();

      // Encrypt inspiration
      const encryptedInspiration = await fhevm
        .createEncryptedInput(talkletReviewAddress, attendee1.address)
        .add16(inspiration)
        .encrypt();

      const tx = await talkletReview
        .connect(attendee1)
        .submitReview(
          0,
          encryptedClarity.handles[0],
          encryptedClarity.inputProof,
          encryptedInnovation.handles[0],
          encryptedInnovation.inputProof,
          encryptedInspiration.handles[0],
          encryptedInspiration.inputProof,
          3, // tags: Technical(1) + Application(2)
          15 // qaDuration: 15 minutes
        );

      await tx.wait();

      const hasReviewed = await talkletReview.hasReviewed(0, attendee1.address);
      expect(hasReviewed).to.be.true;

      const session = await talkletReview.getSession(0);
      expect(session.reviewCount).to.equal(1n);
    });

    it("Should allow second attendee to submit review", async function () {
      const clarity = 9;
      const innovation = 8;
      const inspiration = 10;

      const encryptedClarity = await fhevm
        .createEncryptedInput(talkletReviewAddress, attendee2.address)
        .add16(clarity)
        .encrypt();

      const encryptedInnovation = await fhevm
        .createEncryptedInput(talkletReviewAddress, attendee2.address)
        .add16(innovation)
        .encrypt();

      const encryptedInspiration = await fhevm
        .createEncryptedInput(talkletReviewAddress, attendee2.address)
        .add16(inspiration)
        .encrypt();

      const tx = await talkletReview
        .connect(attendee2)
        .submitReview(
          0,
          encryptedClarity.handles[0],
          encryptedClarity.inputProof,
          encryptedInnovation.handles[0],
          encryptedInnovation.inputProof,
          encryptedInspiration.handles[0],
          encryptedInspiration.inputProof,
          5, // tags: Technical(1) + Theoretical(4)
          20 // qaDuration: 20 minutes
        );

      await tx.wait();

      const session = await talkletReview.getSession(0);
      expect(session.reviewCount).to.equal(2n);
    });

    it("Should revert if unauthorized user tries to submit review", async function () {
      const clarity = 5;
      const encryptedClarity = await fhevm
        .createEncryptedInput(talkletReviewAddress, organizer.address)
        .add16(clarity)
        .encrypt();

      await expect(
        talkletReview
          .connect(organizer)
          .submitReview(
            0,
            encryptedClarity.handles[0],
            encryptedClarity.inputProof,
            encryptedClarity.handles[0],
            encryptedClarity.inputProof,
            encryptedClarity.handles[0],
            encryptedClarity.inputProof,
            1,
            10
          )
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert if session is not active", async function () {
      // Close the session
      await talkletReview.connect(organizer).closeSession(0);

      const clarity = 5;
      const encryptedClarity = await fhevm
        .createEncryptedInput(talkletReviewAddress, attendee3.address)
        .add16(clarity)
        .encrypt();

      await expect(
        talkletReview
          .connect(attendee3)
          .submitReview(
            0,
            encryptedClarity.handles[0],
            encryptedClarity.inputProof,
            encryptedClarity.handles[0],
            encryptedClarity.inputProof,
            encryptedClarity.handles[0],
            encryptedClarity.inputProof,
            1,
            10
          )
      ).to.be.revertedWith("Session not active");
    });
  });

  describe("Decryption", function () {
    it("Should allow organizer to request decryption", async function () {
      // Create a new session for decryption tests
      await talkletReview
        .connect(organizer)
        .createSession("Decryption Test Session", speaker.address, [attendee1.address]);

      const sessionId = 1n;

      // Submit a review
      const clarity = 7;
      const encryptedClarity = await fhevm
        .createEncryptedInput(talkletReviewAddress, attendee1.address)
        .add16(clarity)
        .encrypt();

      await talkletReview
        .connect(attendee1)
        .submitReview(
          sessionId,
          encryptedClarity.handles[0],
          encryptedClarity.inputProof,
          encryptedClarity.handles[0],
          encryptedClarity.inputProof,
          encryptedClarity.handles[0],
          encryptedClarity.inputProof,
          1,
          10
        );

      // Request decryption
      const tx = await talkletReview.connect(organizer).requestDecryption(sessionId);
      await tx.wait();

      // Verify event was emitted
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = talkletReview.interface.parseLog(log);
          return parsed?.name === "DecryptionRequested";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it("Should revert decryption request if no reviews", async function () {
      // Create a new session without reviews
      await talkletReview
        .connect(organizer)
        .createSession("No Reviews Session", speaker.address, [attendee1.address]);

      const sessionId = 2n;

      await expect(
        talkletReview.connect(organizer).requestDecryption(sessionId)
      ).to.be.revertedWith("No reviews yet");
    });
  });

  describe("Session Management", function () {
    it("Should allow organizer to close session", async function () {
      // Create a new session
      await talkletReview
        .connect(organizer)
        .createSession("Close Test Session", speaker.address, [attendee1.address]);

      const sessionId = 3n;

      let session = await talkletReview.getSession(sessionId);
      expect(session.isActive).to.be.true;

      // Close session
      await talkletReview.connect(organizer).closeSession(sessionId);

      session = await talkletReview.getSession(sessionId);
      expect(session.isActive).to.be.false;
    });

    it("Should revert if non-organizer tries to close session", async function () {
      await expect(
        talkletReview.connect(attendee1).closeSession(3n)
      ).to.be.revertedWith("Not organizer");
    });
  });
});
