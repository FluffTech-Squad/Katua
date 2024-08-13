const { MongoClient, ServerApiVersion } = require("mongodb");

require("dotenv").config();

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_STRING, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = client.db("fluffymod");

module.exports.db = db;

module.exports.connectDB = async () => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("fluffymod").command({ ping: 1 });
    console.log("Connected to database (MongoDB)");
  } catch (e) {
    throw e;
  }
};

module.exports.collections = {
  guilds: db.collection("guilds"),
  users: db.collection("users"),
  guildRules: db.collection("guild_rules"),
  premiumGuilds: db.collection("premium_guilds"),
  bans: db.collection("bans"),
  ticketing: db.collection("ticketing"),
  guildTheme: db.collection("guild_themes"),
  guildAssets: db.collection("guild_assets"),
  cmdActivities: db.collection("cmd_activities"),
};
