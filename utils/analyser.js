const { GuildMember, ActivityType } = require("discord.js");
const { openai, getUserThread } = require("./openai.js");
let langs = require("./langs.js");
const getBase64ImageURL = require("./getBase64ImageURL.js");

/**
 *
 * @param {GuildMember} member
 */
function analyser(member) {
  return new Promise(
    /**
     *
     * @param {(value: "invalid" | "neutral" | "valid")=>void} resolve
     * @param {(err: unknown)=>void} reject
     */
    async (resolve, reject) => {
      let guild = member.guild;

      try {
        let thread = await getUserThread(member.user.id);

        if (!thread) {
          thread = await openai.threads.create({
            metadata: { guild: guild.id, user: member.user.id },
          });
        } else {
          let messages = await openai.threads.messages.list(thread.id);

          for (let message of messages.data) {
            if (
              message.metadata &&
              message.metadata.type &&
              message.metadata.type === "analysis"
            ) {
              // Verify if the user didn't change the profile picture or username

              let changed = false;
              let { username, user_id, avatar_url } = message.metadata;

              if (username && user_id && avatar_url) {
                if (username !== member.user.username) changed = true;
                if (user_id !== member.user.id) changed = true; // This is not necessary lol
                if (
                  avatar_url !== member.displayAvatarURL({ extension: "png" })
                )
                  changed = true;

                let base64Avatar = await getBase64ImageURL(avatar_url);
                let base64AvatarMessage = await getBase64ImageURL(avatar_url);

                if (base64Avatar !== base64AvatarMessage) changed = true;

                if (!changed) {
                  return resolve(message.content[0].text.value);
                }
              }
            }
          }
        }

        let content = "";

        content += `Displayname: ${member.user.displayName}\n`;
        content += `Username: ${member.user.username}\n`;
        content += `Presence Status: ${
          member.presence && member.presence.status
            ? member.presence.status
            : "offline"
        }\n`;

        let firstActivity = member.presence
          ? member.presence.activities[0]
          : undefined;

        content += `Custom status: ${
          firstActivity && firstActivity.type === ActivityType.Custom
            ? `"${firstActivity.state}"`
            : "No custom status"
        }\n`;

        content += `Profile picture: first image\n`;

        let date = member.user.createdAt;

        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        content += `Account creation date: ${day}/${month}/${year} \n`;

        let message = await openai.threads.messages.create(thread.id, {
          role: "user",
          content: [
            {
              type: "text",
              text: content,
            },
            {
              type: "image_url",
              image_url: {
                url:
                  member.displayAvatarURL({ extension: "png" }) ||
                  member.user.displayAvatarURL({ extension: "png" }),
                detail: "low",
              },
            },
          ],
          metadata: {
            type: "user_info",
            username: member.user.username,
            user_id: member.user.id,
            avatar_url:
              member.displayAvatarURL({ extension: "png" }) ||
              member.user.displayAvatarURL({ extension: "png" }),
          },
        });

        let run = await openai.threads.runs.createAndPoll(thread.id, {
          assistant_id: process.env.OPENAI_ASSISTANT_ID,
        });

        if (run.status === "completed") {
          let messages = await openai.threads.messages.list(run.thread_id);
          let lastMessage = messages.data[0];

          await openai.threads.messages.update(thread.id, lastMessage.id, {
            metadata: {
              type: "analysis",
              username: member.user.username,
              user_id: member.user.id,
              avatar_url:
                member.displayAvatarURL({ extension: "png" }) ||
                member.user.displayAvatarURL({ extension: "png" }),
            },
          });

          resolve(lastMessage.content[0].text.value);
        } else {
          reject(new Error(run.status));
        }
      } catch (e) {
        console.error(e);
      }
    }
  );
}

// "Ask to explain the analysis" function

/**
 *
 * @param {import("openai/resources/beta/threads/threads.mjs").Thread} thread
 * @param {string} lang
 * @param {"valid" | "invalid" | "neutral"} state
 * @returns {Promise<string>}
 */
function askExplanation(thread, lang, state) {
  let sentences = langs[lang];

  return new Promise(async (resolve, reject) => {
    let alreadyAsked = false;
    let explanation = "";

    let messages = await openai.threads.messages.list(thread.id);
    let lastMessage = messages.data[0];

    if (
      lastMessage.metadata &&
      lastMessage.metadata.type &&
      lastMessage.metadata.type === "explanation"
    ) {
      alreadyAsked = true;
      explanation = lastMessage.content[0].text.value;
    }

    if (alreadyAsked) {
      resolve(explanation);
      return;
    }

    let message = await openai.threads.messages.create(thread.id, {
      content: sentences.askAIExplanation.replace(
        "$1",
        sentences["words"][state.toLowerCase()]
      ),
      role: "user",
    });

    let run = await openai.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
    });

    if (run.status === "completed") {
      let messages = await openai.threads.messages.list(run.thread_id);
      let lastMessage = messages.data[0];

      await openai.threads.messages.update(thread.id, lastMessage.id, {
        metadata: { type: "explanation" },
      });

      resolve(lastMessage.content[0].text.value);
    }
  });
}

analyser.askExplanation = askExplanation;

module.exports = analyser;
