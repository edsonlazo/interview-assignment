const { getProfile } = require("../middleware/getProfile");
const { isClient } = require("../helper");
const { sequelize } = require("../model");
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();

router.get("/jobs/unpaid", getProfile, async (req, res) => {
  const { Job, Contract } = req.app.get("models");
  let contractQuery = {
    status: "in_progress",
  };
  if (isClient(req.profile)) {
    contractQuery["ClientId"] = req.profile.id;
  } else {
    contractQuery["ContractorId"] = req.profile.id;
  }
  const jobs = await Job.findAll({
    include: {
      model: Contract,
      as: "Contract",
      where: contractQuery,
    },
    where: {
      paid: {
        [Op.eq]: null,
      },
    },
  });
  if (!jobs || jobs.length == 0) return res.status(404).end();
  res.json(jobs);
});

router.post("/jobs/:job_id/pay", getProfile, async (req, res) => {
  //first we check if caller is client
  if (!isClient(req.profile)) return res.status(403).end();
  const t = await sequelize.transaction();
  try {
    //then we check if the job exists and is unpaid
    const { Job, Contract, Profile } = req.app.get("models");
    const job = await Job.findOne({
      include: {
        model: Contract,
        as: "Contract",
      },
      where: {
        id: req.params.job_id,
        paid: {
          [Op.eq]: null,
        },
      },
      transaction: t,
    });
    if (!job) return res.status(404).end("Job not found");
    //check that the caller is indeed the client
    if (job.Contract.ClientId != req.profile.id) return res.status(403).end();

    //then we move the balance from client to contractor
    const client = await Profile.findOne({
      where: {
        id: job.Contract.ClientId,
      },
      transaction: t,
    });

    //check if client has enough balance
    if (client.balance < job.price)
      return res.status(403).end("Not enough balance");

    const contractor = await Profile.findOne({
      where: {
        id: job.Contract.ContractorId,
      },
      transaction: t,
    });

    //update balances

    client.balance -= job.price;
    contractor.balance += job.price;
    job.paid = true;
    job.paymentDate = new Date();
    await client.save({ transaction: t });
    await contractor.save({ transaction: t });
    await job.save({ transaction: t });
    t.commit();
    return res.status(200).end("Job paid");
  } catch (err) {
    await t.rollback();
    return res.status(500).end("Internal server error");
  }
});

module.exports.jobsRouter = router;
