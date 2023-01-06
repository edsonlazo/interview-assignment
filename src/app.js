const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");

const { contractRouter } = require("./routes/contractRouter");
const { jobsRouter } = require("./routes/jobsRouter");

const app = express();

app.use(bodyParser.json());
app.use(contractRouter);
app.use(jobsRouter);
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

module.exports = app;
