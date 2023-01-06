const { getProfile } = require("../middleware/getProfile");
const { isClient } = require("../helper");
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

module.exports.jobsRouter = router;
