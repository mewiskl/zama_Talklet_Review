import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:createSession", "Create a new academic session")
  .addParam("title", "Session title")
  .addParam("speaker", "Speaker address")
  .addOptionalParam("attendees", "Comma-separated attendee addresses")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const TalkletReview = await deployments.get("TalkletReview");
    const signers = await ethers.getSigners();

    const talkletReviewFactory = await ethers.getContractFactory("TalkletReview");
    const talkletReview = talkletReviewFactory.attach(TalkletReview.address).connect(signers[0]);

    const attendeeAddresses = taskArguments.attendees
      ? taskArguments.attendees.split(",").map((addr: string) => addr.trim())
      : [];

    const tx = await talkletReview.createSession(
      taskArguments.title,
      taskArguments.speaker,
      attendeeAddresses
    );

    const receipt = await tx.wait();
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = talkletReview.interface.parseLog(log);
        return parsed?.name === "SessionCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = talkletReview.interface.parseLog(event);
      console.log(`Session created with ID: ${parsed?.args.sessionId}`);
    }
  });

task("task:authorizeAttendees", "Authorize attendees for a session")
  .addParam("sessionid", "Session ID")
  .addParam("attendees", "Comma-separated attendee addresses")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const TalkletReview = await deployments.get("TalkletReview");
    const signers = await ethers.getSigners();

    const talkletReviewFactory = await ethers.getContractFactory("TalkletReview");
    const talkletReview = talkletReviewFactory.attach(TalkletReview.address).connect(signers[0]);

    const attendeeAddresses = taskArguments.attendees
      .split(",")
      .map((addr: string) => addr.trim());

    const tx = await talkletReview.authorizeAttendees(
      taskArguments.sessionid,
      attendeeAddresses
    );
    await tx.wait();

    console.log(`Authorized ${attendeeAddresses.length} attendees for session ${taskArguments.sessionid}`);
  });

task("task:closeSession", "Close a session")
  .addParam("sessionid", "Session ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const TalkletReview = await deployments.get("TalkletReview");
    const signers = await ethers.getSigners();

    const talkletReviewFactory = await ethers.getContractFactory("TalkletReview");
    const talkletReview = talkletReviewFactory.attach(TalkletReview.address).connect(signers[0]);

    const tx = await talkletReview.closeSession(taskArguments.sessionid);
    await tx.wait();

    console.log(`Session ${taskArguments.sessionid} closed`);
  });

task("task:getSession", "Get session details")
  .addParam("sessionid", "Session ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const TalkletReview = await deployments.get("TalkletReview");
    const signers = await ethers.getSigners();

    const talkletReviewFactory = await ethers.getContractFactory("TalkletReview");
    const talkletReview = talkletReviewFactory.attach(TalkletReview.address).connect(signers[0]);

    const session = await talkletReview.getSession(taskArguments.sessionid);

    console.log("\n=== Session Details ===");
    console.log(`Title: ${session.title}`);
    console.log(`Speaker: ${session.speaker}`);
    console.log(`Organizer: ${session.organizer}`);
    console.log(`Timestamp: ${new Date(Number(session.timestamp) * 1000).toISOString()}`);
    console.log(`Active: ${session.isActive}`);
    console.log(`Review Count: ${session.reviewCount}`);
    console.log(`Decrypted: ${session.isDecrypted}`);
    
    if (session.isDecrypted) {
      console.log(`\nDecrypted Scores (Total):`);
      console.log(`  Clarity: ${session.decryptedClarity}`);
      console.log(`  Innovation: ${session.decryptedInnovation}`);
      console.log(`  Inspiration: ${session.decryptedInspiration}`);
      
      if (session.reviewCount > 0) {
        console.log(`\nAverage Scores:`);
        console.log(`  Clarity: ${(session.decryptedClarity / Number(session.reviewCount)).toFixed(2)}`);
        console.log(`  Innovation: ${(session.decryptedInnovation / Number(session.reviewCount)).toFixed(2)}`);
        console.log(`  Inspiration: ${(session.decryptedInspiration / Number(session.reviewCount)).toFixed(2)}`);
      }
    }
  });

