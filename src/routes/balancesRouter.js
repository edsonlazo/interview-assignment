const { getProfile } = require("../middleware/getProfile");
const { isClient } = require("../helper");
const { sequelize } = require("../model");
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();

router.post("/balances/deposit/:userId", async (req, res) => {
  const amount = req.body.amount;

  if (isNaN(amount) || amount < 0) {
    return res.status(400).end("Amount must be a number and greater than 0");
  }

  const { Job, Contract, Profile } = req.app.get("models");

  let contractQuery = {
    status: "in_progress",
    clientId: req.params.userId,
  };

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

  if (!jobs || jobs.length == 0)
    return res.status(404).end("The client does not have any jobs in progress");

  // get total amount from unpaid jobs
  const UnpaidJobsAmount = jobs.reduce((acc, job) => {
    return acc + job.price;
  }, 0);

  if (amount > UnpaidJobsAmount * 0.25)
    return res.status(400).end("The amount is too high");

  const t = await sequelize.transaction();

  try {
    const client = await Profile.findOne({
      where: {
        id: req.params.userId,
      },
      transaction: t,
    });

    if (!client) {
      t.rollback();
      return res.status(404).end("Client not found");
    }
    //check if caller is client
    if (!isClient(client)) {
      t.rollback();
      return res.status(403).end("Only clients can deposit money");
    }
    client.balance = client.balance + amount;
    await client.save({ transaction: t });
    await t.commit();
    res.json(client);
  } catch (err) {
    await t.rollback();
    res.status(500).end(err.message);
  }
});

module.exports.balancesRouter = router;
