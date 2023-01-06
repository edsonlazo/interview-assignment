const { getProfile } = require("../middleware/getProfile");
const { isClient } = require("../helper");
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();

/**
 * FIX ME!
 * @returns contract by id
 */
router.get("/contracts/:id", getProfile, async (req, res) => {
  const { Contract } = req.app.get("models");
  const { id } = req.params;
  let query = { id: id };
  if (isClient(req.profile)) {
    query["ClientId"] = req.profile.id;
  } else {
    query["ContractorId"] = req.profile.id;
  }
  const contract = await Contract.findOne({
    where: query,
  });
  if (!contract) return res.status(404).end();
  res.json(contract);
});

router.get("/contracts", getProfile, async (req, res) => {
  const { Contract } = req.app.get("models");
  let query = {
    status: {
      [Op.not]: "terminated",
    },
  };
  if (isClient(req.profile)) {
    query["ClientId"] = req.profile.id;
  } else {
    query["ContractorId"] = req.profile.id;
  }
  const contracts = await Contract.findAll({
    where: query,
  });
  if (!contracts || contracts.length == 0) return res.status(404).end();
  res.json(contracts);
});

module.exports.contractRouter = router;
