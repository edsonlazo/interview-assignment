const { getProfile } = require("../middleware/getProfile");
const { isClient } = require("../helper");
const { sequelize } = require("../model");
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();

Date.prototype.isDateValid = function () {
  return this.getTime() === this.getTime();
};

router.get("/admin/best-profession", async (req, res) => {
  const { start, end } = req.query;
  //Validate dates
  if (!start || !end)
    return res.status(400).end("Start and end dates are required");
  if (!new Date(start).isDateValid() || !new Date(end).isDateValid())
    return res.status(400).end("Invalid date format");
  if (new Date(start) > new Date(end))
    return res.status(400).end("Start date must be before end date");

  const { Job, Contract, Profile } = req.app.get("models");
  const jobs = await Job.findAll({
    where: {
      paymentDate: {
        [Op.between]: [new Date(start), new Date(end)],
      },
      paid: true,
    },
    include: {
      model: Contract,
      as: "Contract",
      include: {
        model: Profile,
        as: "Contractor",
      },
    },
    group: ["Contract.Contractor.profession"],
    attributes: [[sequelize.fn("sum", sequelize.col("price")), "total"]],
    order: [[sequelize.fn("sum", sequelize.col("price")), "DESC"]],
  });
  if (jobs.length == 0)
    return res.status(404).end("No jobs found for those dates");

  return res.status(200).json({
    profession: jobs[0].Contract.Contractor.profession,
  });
});

router.get("/admin/best-clients", getProfile, async (req, res) => {
  const { start, end } = req.query;
  //Validate dates
  if (!start || !end)
    return res.status(400).end("Start and end dates are required");
  if (!new Date(start).isDateValid() || !new Date(end).isDateValid())
    return res.status(400).end("Invalid date format");
  if (new Date(start) > new Date(end))
    return res.status(400).end("Start date must be before end date");

  const { Job, Contract, Profile } = req.app.get("models");
  const jobs = await Job.findAll({
    where: {
      paymentDate: {
        [Op.between]: [new Date(start), new Date(end)],
      },
      paid: true,
    },
    include: {
      model: Contract,
      as: "Contract",
      include: {
        model: Profile,
        as: "Client",
      },
    },
    group: ["Contract.Client.id"],
    attributes: [[sequelize.fn("sum", sequelize.col("price")), "total"]],
    order: [[sequelize.fn("sum", sequelize.col("price")), "DESC"]],
    limit: req.query.limit || 2,
  });
  if (jobs.length == 0)
    return res.status(404).end("No jobs found for those dates");

  let clients = [];
  jobs.forEach((job) => {
    clients.push(job.Contract.Client);
  });
  return res.status(200).json(clients);
});

router.get("/admin/best-clients", getProfile, async (req, res) => {});
module.exports.adminRouter = router;
