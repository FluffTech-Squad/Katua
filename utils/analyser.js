const { GuildMember, ActivityType, Message } = require("discord.js");
const { openai, getUserThread } = require("./openai.js");
let langs = require("./langs.js");
const getBase64ImageURL = require("./getBase64ImageURL.js");
require("dotenv").config();

/**
 *
 * @param {GuildMember} member
 * @param {string} guild_theme
 */
function analyser(member, guild_theme) {
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
              if (message.content[0].type !== "text") break;

              // Verify if the user didn't change the profile picture or username

              let changed = false;
              let { username, avatar_url, custom_status } = message.metadata;

              if (username && avatar_url) {
                if (username !== member.user.username) changed = true;
                let actualAvatar = member.user
                  .displayAvatarURL()
                  .replace(".webp", ".png");

                if (avatar_url.replace(".webp", ".png") !== actualAvatar)
                  changed = true;

                let base64Avatar = await getBase64ImageURL(
                  avatar_url.replace(".webp", ".png")
                );
                let base64AvatarMessage = await getBase64ImageURL(
                  actualAvatar.replace(".webp", ".png")
                );

                if (base64Avatar !== base64AvatarMessage) changed = true;
              }

              let userCustomStatus = member.presence
                ? member.presence.activities.find(
                    (activity) => activity.type === ActivityType.Custom
                  )
                : "No custom status";

              // a

              if (userCustomStatus && custom_status) {
                if (custom_status !== userCustomStatus.state) changed = true;
              }

              if (userCustomStatus && !custom_status) changed = true;

              // Delete the thread if it was changed

              if (changed) {
                await openai.threads.del(thread.id);

                thread = await openai.threads.create({
                  metadata: { guild: guild.id, user: member.user.id },
                });
              } else {
                let result = JSON.parse(message.content[0].text.value).status;
                resolve(result);

                return;
              }
            }
          }
        }

        let content = "";

        content += `username: ${member.user.username}\n`;
        content += `display_name: "${member.user.displayName}"\n`;

        /**
         * @type {string}
         */
        let customActivity = member.presence;

        if (customActivity) {
          let c = member.presence.activities.find(
            (a) => a.type === ActivityType.Custom
          );

          if (c) customActivity = c ? c.state : "offline";
          else customActivity = "No custom status";
        }

        content += `custom_presence: ${
          customActivity ? `"${customActivity}"` : "No custom status"
        }\n`;

        content += `avatar_url: in attachments\n`;
        content += `guild_subject: furry\n`;

        let joinedDate = member.user.createdAt;

        let joinedYear = joinedDate.getFullYear();
        let joinedMonth = joinedDate.getMonth() + 1;
        let joinedDay = joinedDate.getDate();

        content += `joined_date: ${joinedDay}/${joinedMonth}/${joinedYear}\n`;

        let date = member.user.createdAt;

        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        content += `creation_date: ${day}/${month}/${year}\n`;

        let guild_subject = guild_theme || "furry";

        await openai.threads.messages.create(thread.id, {
          role: "user",
          content: [
            {
              type: "text",
              text: content,
            },
            {
              type: "image_url",
              image_url: {
                url: member.user.displayAvatarURL(),
              },
            },
          ],
          metadata: {
            type: "user_info",
            username: member.user.username,
            user_id: member.user.id,
            avatar_url: member.user.displayAvatarURL(),
            custom_status: customActivity || "No custom status",
          },
        });

        let run = await openai.threads.runs.createAndPoll(thread.id, {
          assistant_id: process.env.OPENAI_ASSISTANT_ID,
          additional_instructions: `The actual server subject is/are "${guild_subject}". json:`,
          response_format: { type: "json_object" },
          tool_choice: {
            type: "function",
            function: {
              name: "analyse_user_profile_safeness",
            },
          },
        });

        if (run.status === "requires_action") {
          let run2 = await openai.threads.runs.submitToolOutputsAndPoll(
            thread.id,
            run.id,
            {
              tool_outputs: [
                {
                  output: `{status: "valid" or "invalid" or "neutral"}`,
                  tool_call_id:
                    run.required_action.submit_tool_outputs.tool_calls[0].id,
                },
              ],
            }
          );

          if (run2.status === "completed") {
            let messages = await openai.threads.messages.list(run2.thread_id);
            let lastMessage = messages.data[0];

            let content = lastMessage.content[0];

            if (content.type === "text") {
              await openai.threads.messages.update(
                run2.thread_id,
                lastMessage.id,
                {
                  metadata: {
                    type: "analysis",
                    username: member.user.username,
                    user_id: member.user.id,
                    avatar_url: member.user.displayAvatarURL(),
                    custom_status: customActivity || "No custom status",
                  },
                }
              );

              let result = JSON.parse(content.text.value).status;
              resolve(result);
            }
          } else {
            reject(new Error(run));
          }
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
  return new Promise(async (resolve, reject) => {
    let messages = await openai.threads.messages.list(thread.id);

    for (let message of messages.data) {
      if (
        message.metadata &&
        message.metadata.type &&
        message.metadata.type === "explanation"
      ) {
        let content = message.content[0];

        if (content.type === "text") {
          let result = JSON.parse(content.text.value).explanation;
          resolve(result);
          return;
        }
      }
    }

    let run = await openai.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      metadata: { type: "explanation" },
      response_format: { type: "json_object" },
      tool_choice: {
        type: "function",
        function: {
          name: "explain_result_why",
        },
      },
      instructions: `explain in two sentences here in language: ${lang} why the user is ${state} in json {"explanation": "Explanation"}. Don't make additional comments. json:`,
    });

    if (run.status === "requires_action") {
      let run2 = await openai.threads.runs.submitToolOutputsAndPoll(
        thread.id,
        run.id,
        {
          tool_outputs: [
            {
              output: `{explanation: "Explanation"}`,
              tool_call_id:
                run.required_action.submit_tool_outputs.tool_calls[0].id,
            },
          ],
        }
      );

      if (run2.status === "completed") {
        let messages = await openai.threads.messages.list(run2.thread_id);
        let lastMessage = messages.data[0];

        await openai.threads.messages.update(thread.id, lastMessage.id, {
          metadata: { type: "explanation" },
        });

        if (lastMessage.content[0].type === "text") {
          let result = JSON.parse(
            lastMessage.content[0].text.value
          ).explanation;

          resolve(result);
        }
      }
    }
  });
}

/**
 *
 * @param {import("openai/src/resources/beta/index.js").Thread} thread
 * @param {Message} message
 * @returns
 */
async function airlockMessageAnalysis(thread, message) {
  let content = message.content;
  let attachments = message.attachments.toJSON();

  let lang = message.guild.preferredLocale || "en-US";

  let msg = await openai.threads.messages.create(thread.id, {
    role: "user",
    content: [
      {
        type: "text",
        text: content,
      },
      {
        type: "image_url",
        image_url: {
          url: attachments[0].url,
          detail: "low",
        },
      },
    ],
  });

  let run = await openai.threads.runs.createAndPoll(thread.id, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID,
    response_format: { type: "json_object" },
    tool_choice: {
      type: "function",
      function: {
        name: "analyse-user-verification-message",
      },
    },
    additional_instructions: `json:`,
  });

  if (run.status === "requires_action") {
    let run2 = await openai.threads.runs.submitToolOutputsAndPoll(
      thread.id,
      run.id,
      {
        tool_outputs: [
          {
            output: `{opinion: "your opinion here (too poor, too irrelevant, etc) in language: ${lang}"}`,
            tool_call_id:
              run.required_action.submit_tool_outputs.tool_calls[0].id,
          },
        ],
      }
    );

    if (run2.status === "completed") {
      let messages = await openai.threads.messages.list(run2.thread_id);
      let lastMessage = messages.data[0];

      let content = lastMessage.content[0];

      if (content.type === "text") {
        resolve(JSON.parse(content.text.value).opinion);
      }
    }
  }
}

analyser.airlockMessageAnalysis = airlockMessageAnalysis;

analyser.askExplanation = askExplanation;

module.exports = analyser;
