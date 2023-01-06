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

describe("GET /jobs/unpaid", () => {
  it("should return all unpaid jobs for active contracts only", async () => {
    const res = await chai
      .request(app)
      .get("/jobs/unpaid")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
    expect(res.body)
      .excludingEvery(["createdAt", "updatedAt", "Contract"])
      .to.deep.equal([
        {
          id: 2,
          description: "work",
          price: 201,
          paid: null,
          paymentDate: null,
          ContractId: 2,
        },
      ]);
  });
  it("should return 404 if the user has no unpaid jobs", async () => {
    const res = await chai
      .request(app)
      .get("/jobs/unpaid")
      .set("Accept", "application/json")
      .set("profile_id", 5);
    expect(res).to.have.status(404);
  });
});

describe("POST /jobs/:job_id/pay", () => {
  it("should return 200 if the job is paid", async () => {
    const res = await chai
      .request(app)
      .post("/jobs/2/pay")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(200);
  });
  it("should return 404 if the job is not found", async () => {
    const res = await chai
      .request(app)
      .post("/jobs/999/pay")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(404);
  });
  it("should return 403 if the client's balance is lower than the job price", async () => {
    const res = await chai
      .request(app)
      .post("/jobs/5/pay")
      .set("Accept", "application/json")
      .set("profile_id", 7);
    expect(res).to.have.status(403);
  });
});

describe("POST /balances/deposit/:userId", () => {
  it("should return 200 if the deposit is successful", async () => {
    const res = await chai
      .request(app)
      .post("/balances/deposit/2")
      .set("Accept", "application/json")
      .set("profile_id", 2)
      .send({ amount: 100 });
    expect(res).to.have.status(200);
  });
  it("should return 404 if the user is not found", async () => {
    const res = await chai
      .request(app)
      .post("/balances/deposit/999")
      .set("Accept", "application/json")
      .set("profile_id", 2)
      .send({ amount: 100 });
    expect(res).to.have.status(404);
  });
  it("should return 400 if the amount is more than 25% of his total jobs to pay", async () => {
    const res = await chai
      .request(app)
      .post("/balances/deposit/2")
      .set("Accept", "application/json")
      .set("profile_id", 2)
      .send({ amount: 100000 });
    expect(res).to.have.status(400);
  });

  it("should return 400 if the amount is not a number", async () => {
    const res = await chai
      .request(app)
      .post("/balances/deposit/7")
      .set("Accept", "application/json")
      .set("profile_id", 7)
      .send({ amount: "asda" });
    expect(res).to.have.status(400);
  });
});

describe("GET /admin/best-profession?start=<date>&end=<date>", () => {
  it("should return the best profession in the given period", async () => {
    const res = await chai
      .request(app)
      .get("/admin/best-profession?start=2020-01-01&end=2020-12-31")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("object");
    expect(res.body).to.deep.equal({
      profession: "Programmer",
    });
  });
});

describe("GET /admin/best-clients?start=<date>&end=<date>&limit=<integer>", () => {
  it("should return the best clients in the given period", async () => {
    const res = await chai
      .request(app)
      .get("/admin/best-clients?start=2020-01-01&end=2020-12-31&limit=2")
      .set("Accept", "application/json")
      .set("profile_id", 1);
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
    expect(res.body)
      .excludingEvery(["createdAt", "updatedAt", "balance"])
      .to.deep.equal([
        {
          id: 4,
          firstName: "Ash",
          lastName: "Kethcum",
          profession: "Pokemon master",
          type: "client",
        },
        {
          id: 2,
          firstName: "Mr",
          lastName: "Robot",
          profession: "Hacker",
          type: "client",
        },
      ]);
  });
});
