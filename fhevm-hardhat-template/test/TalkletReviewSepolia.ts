import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { TalkletReview } from "../types";

describe("TalkletReview - Sepolia Network", function () {
  let talkletReview: TalkletReview;

  before(async function () {
    // Skip if not on Sepolia
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111n) {
      this.skip();
    }

    const TalkletReviewDeployment = await deployments.get("TalkletReview");
    talkletReview = (await ethers.getContractAt(
      "TalkletReview",
      TalkletReviewDeployment.address
    )) as unknown as TalkletReview;
  });

  it("Should get session count", async function () {
    const count = await talkletReview.getSessionCount();
    expect(count).to.be.a("bigint");
  });

  it("Should verify contract is deployed", async function () {
    const code = await ethers.provider.getCode(await talkletReview.getAddress());
    expect(code).to.not.equal("0x");
  });
});

