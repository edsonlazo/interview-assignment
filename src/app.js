const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");

const { contractRouter } = require("./routes/contractRouter");
const { jobsRouter } = require("./routes/jobsRouter");
const { balancesRouter } = require("./routes/balancesRouter");
const { adminRouter } = require("./routes/adminRouter");

const app = express();

app.use(bodyParser.json());
app.use(contractRouter);
app.use(jobsRouter);
app.use(balancesRouter);
app.use(adminRouter);

app.set("sequelize", sequelize);
app.set("models", sequelize.models);

module.exports = app;
