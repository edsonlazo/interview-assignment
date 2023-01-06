const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = require("chai").expect;
const chaiExclude = require("chai-exclude");
const app = require("../src/app");
chai.use(chaiExclude);
chai.use(chaiHttp);

describe("GET /contracts/:id", () => {
  it("should return contracts with id = 1", async () => {
    const res = await chai
      .request(app)
      .get("/contracts/1")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("object");
    expect(res.body).to.have.property("id", 1);
    expect(res.body).to.have.property("terms", "bla bla bla");
    expect(res.body).to.have.property("status", "terminated");
  });
  it("should return 404 if contract not found", async () => {
    const res = await chai
      .request(app)
      .get("/contracts/999")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(404);
  });
  it("should return 404 if the contract do not belong to the profile calling", async () => {
    const res = await chai
      .request(app)
      .get("/contracts/3")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(404);
  });
});

describe("GET /contracts", () => {
  it("should return all non terminated contracts belonging to a user and status 200", async () => {
    const res = await chai
      .request(app)
      .get("/contracts")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
    expect(res.body)
      .excludingEvery(["createdAt", "updatedAt"])
      .to.deep.equal([
        {
          id: 2,
          terms: "bla bla bla",
          status: "in_progress",
          ClientId: 1,
          ContractorId: 6,
        },
      ]);
  });
  it("should return 404 if the user has no contracts", async () => {
    const res = await chai
      .request(app)
      .get("/contracts")
      .set("Accept", "application/json")
      .set("profile_id", 5);
    expect(res).to.have.status(404);
  });
});