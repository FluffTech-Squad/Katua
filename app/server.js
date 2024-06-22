const { Client } = require("discord.js");
const express = require("express");
const app = express();
const axios = require("axios").default;

let topggRoot = "https://top.gg/api";
let topggToken = process.env.TOPGG_TOKEN;

/**
 *
 * @param {Client} discordClient
 */

async function serverHandler(discordClient) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.send("Hello, World!");
  });

  app.post("/voting", async (req, res) => {
    let Authorization = req.headers.authorization;
    if (Authorization !== process.env.TOPGG_AUTHORIZATION) {
      return res.status(401).send("Unauthorized");
    }

    console.log("Received a vote.");
    console.log(req.body);

    res.status(200).send("OK");
  });

  app.listen(process.env.PORT || 1027, () => {
    console.log(`Server is running on port ${process.env.PORT || 1027}.`);
  });
}

module.exports = serverHandler;
