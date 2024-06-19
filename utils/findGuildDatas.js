const { Guild, BaseGuildTextChannel } = require("discord.js");
const fs = require("fs");

/**
 *
 * @param {Guild} guild
 */
async function findGuildDatas(guild) {
  // Get guild rules settings

  /**
   * @type {{logChannel:BaseGuildTextChannel  | null;
   * guildRulesData: {[key:string]:boolean}, prevent_members:boolean, prevent_channel: BaseGuildTextChannel | null
   * }}
   */
  let retObj = {
    logChannel: null,
    prevent_channel: null,
    prevent_members: false,
  };

  let guildsFolder = __dirname.replace("utils", "guilds");

  if (!fs.existsSync(guildsFolder)) {
    fs.mkdirSync(guildsFolder);
  }

  let guildsRulesFolder = guildsFolder + "/rules";
  let guildFilePath = guildsFolder + `/${guild.id}.json`;

  if (!fs.existsSync(guildsRulesFolder)) {
    fs.mkdirSync(guildsRulesFolder);
  }

  let guildRulesFile = guildsRulesFolder + `/${guild.id}.json`;

  if (!fs.existsSync(guildRulesFile)) {
    fs.writeFileSync(guildRulesFile, JSON.stringify({}));
  }

  if (fs.existsSync(guildFilePath)) {
    let guildData = JSON.parse(fs.readFileSync(guildFilePath, "utf-8"));

    if (guildData.log_channel_id) {
      /**
       * @type {import("discord.js").GuildTextBasedChannel}
       */
      let ch = await guild.channels.fetch(guildData.log_channel_id);

      retObj.logChannel = ch;
    }

    if (guildData.inform_members_channel_id) {
      let ch = await guild.channels.fetch(guildData.inform_members_channel_id);

      retObj.prevent_channel = ch;
    }

    if (guildData.prevent_members && guildData.prevent_members === true) {
      retObj.prevent_members = true;
    }
  }

  let guildRulesData = JSON.parse(fs.readFileSync(guildRulesFile, "utf-8"));

  retObj.guildRulesData = guildRulesData;

  return retObj;
}

/**
 *
 * @param {string} guild_id
 */

async function findGuildDatasID(guild_id) {
  // Get guild rules settings

  /**
   * @type {{logChannel:BaseGuildTextChannel  | null;
   * guildRulesData: {[key:string]:boolean}, prevent_members:boolean, prevent_channel: BaseGuildTextChannel | null
   * }}
   */
  let retObj = {
    logChannel: null,
    prevent_channel: null,
    prevent_members: false,
  };

  let guildsFolder = __dirname.replace("utils", "guilds");

  if (!fs.existsSync(guildsFolder)) {
    fs.mkdirSync(guildsFolder);
  }

  let guildsRulesFolder = guildsFolder + "/rules";
  let guildFilePath = guildsFolder + `/${guild_id}.json`;

  if (!fs.existsSync(guildsRulesFolder)) {
    fs.mkdirSync(guildsRulesFolder);
  }

  let guildRulesFile = guildsRulesFolder + `/${guild_id}.json`;

  if (!fs.existsSync(guildRulesFile)) {
    fs.writeFileSync(guildRulesFile, JSON.stringify({}));
  }

  if (fs.existsSync(guildFilePath)) {
    let guildData = JSON.parse(fs.readFileSync(guildFilePath, "utf-8"));

    if (guildData.log_channel_id) {
      /**
       * @type {import("discord.js").GuildTextBasedChannel}
       */
      let ch = await guild.channels.fetch(guildData.log_channel_id);

      retObj.logChannel = ch;
    }

    if (guildData.inform_members_channel_id) {
      let ch = await guild.channels.fetch(guildData.inform_members_channel_id);

      retObj.prevent_channel = ch;
    }

    if (guildData.prevent_members && guildData.prevent_members === true) {
      retObj.prevent_members = true;
    }
  }

  let guildRulesData = JSON.parse(fs.readFileSync(guildRulesFile, "utf-8"));

  retObj.guildRulesData = guildRulesData;

  return retObj;
}

findGuildDatas.byId = findGuildDatasID;

module.exports = findGuildDatas;
