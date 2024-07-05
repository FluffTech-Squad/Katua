// const { Client, GuildMember, TextChannel } = require("discord.js");
const express = require("express");
const app = express();

// const { collections } = require("../utils/mongodb");
// const { userEmbed } = require("../utils/embedFactory");
// const goldShardsToTime = require("../utils/goldShardsToTime");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(req.path, req.method, req.body, req.headers);

  // Block if it is not from my API server with a secret key

  // ...
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app
  .listen(process.env.PORT || 1027, () => {
    console.log(`Server is running on port ${process.env.PORT || 1027}.`);
  })
  .on("error", (e) => {});
