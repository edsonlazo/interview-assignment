const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");

const { contractRouter } = require("./routes/contractRoutes");

const app = express();

app.use(bodyParser.json());
app.use(contractRouter);
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

module.exports = app;
