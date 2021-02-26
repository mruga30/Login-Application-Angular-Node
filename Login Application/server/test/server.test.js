const chai = require("chai");
const chaiHttp = require("chai-http"); //used for handling the rest APIs

const expect = chai.expect;
// const app = require("../servernewdb");
chai.use(chaiHttp);

describe("Login", () => {
  it("should return 200 ok for /login", () => {
    chai
      .request("http://localhost:12000/login")
      .post("/login")
      .end((err, res) => {
        expect(res.status).to.be.equal(200);
        expect(err).to.be.equal(null);
        expect(res.body.length).to.be.greaterThan(0);
      });
  });
});

describe("Register", () => {
  it("should return 200 ok for /register", () => {
    chai
      .request("http://localhost:12000/register")
      .post("/register")
      .end((err, res) => {
        expect(res.status).to.be.equal(200);
        expect(err).to.be.equal(null);
        expect(res.body.length).to.be.greaterThan(0);
      });
  });
});

describe("Forgot Password", () => {
  it("should return 200 ok for /forgotpassword", () => {
    chai
      .request("http://localhost:12000/forgotpassword")
      .post("/forgotpassword")
      .end((err, res) => {
        expect(res.status).to.be.equal(200);
        expect(err).to.be.equal(null);
        expect(res.body.length).to.be.greaterThan(0);
      });
  });
});
