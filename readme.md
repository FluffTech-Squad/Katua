# 🐾🏳️‍🌈 Katua: Your Niche Best Anti-Troll Moderator 🤖

Katua is powered by AI to analyse user profiles, whether when they are joining your guild or with a manual command. Katua will determine if the user is safe, seems to be a troll or has a neutral profile, but only you, moderators and admins have the primal right to ban those users depending of their behavior, however, Katua will delete harmful messages (from users detected as unsafe) for safety.

That's main's Katua feature. **AI-powered features are premium only, but if your server is a furry or a LGBT+ server, me, Nekomancer, won't hesitate to give you that gift and make you try out those features!**

## Auto-Moderation

With the API enabled, troll detection is working.
↘️ _This means that you need Premium_

<blockquote>Setup the log channel before trying this out, otherwise it won't do anything. Do <code>/config logs log-channel <#channel></code></blockquote><br>

<ul>
<li> When a user joins, bot will send a message in your logs about this user, including if it seems to be safe/neutral or unsafe, if it detects the user as unsafe, the bot will write a report describing why this "special" user's profile is considered as unsafe. It will not ban or kick automatically.</li>

<li> When a user sends a message: detects if a user says inappropriate message (non-moderators), the message will be deleted automatically and sends a log about the content.</li>

<li> Katua can freely detect NSFW medias (only images at the moment), freely meaning that it doesn't need API requests. NSFW content will be deleted if it's a non-NSFW channel, and send a report (without showing the images ofc)</li>

<li> Katua can provide in how much guilds a user has been banned/kicked (of course, Katua must be there) and also provides the guilds in common with Katua. Account Creation Date, and Join Date via ➡️ logging, <code>/userinfo @user</code> command and <code>/analyse</code> command.</li>
</ul>

---

## 🗝️ Golden Festival - 15th July 2024

**Voting for Katua will give you Gold Shards, this will give you the capacity of gifting premium to your favorite guild for a limited time. 2 Golden shards = 12 hours, 1 extra shard adds 6 hours (a vote on weekend counts as 2 votes). Farm gold shards and give your favorite guild premium for a maximum time FOR FREE**

## 🧰 Features

### Basic commands

#### `help`

Get list of commands.

**Usages:**
`help`

#### `ping`

🐌 _Snail or Cheetah - that's the question_

Check the bot's latency.

**Usages:**
`ping`

#### `userinfo`

Get information about a user.

<blockquote>It gives the same informations about guilds in common, total of bans and kicks (interserver), account creation date... But doesn't require premium because it doesn't analyse the profile.</blockquote>
<br>
<blockquote>Eventually, you can request an analysis of the user in question, but it requires premium.</blockquote>

**Usages:**
`/userinfo <@user>`

_Illustration soon..._

#### `analyse`

🧐 Analyse a suspicious user's profile.

_Mmh, this user looks very sus, i'm gonna keep an eye on them..._
_Omae wa mou- shindeiru_

<blockquote>This is a premium feature</blockquote>

**Usages:**
`/analyse <@user>`

_Illustration soon..._

### ⚙️🪛 Setup Katua

Configure Katua for your guild.

_Lemme save you from misfortune, I'll guide you._

#### 🔔 Setup log channel(s)

<blockquote>Analysing joining members to send a report in the log-channel (and inform members for potential in public-channel) is a premium feature. However, the NSFW filter is free and enabled by default.</blockquote><br>

**Usages:**

`/config logs log-channel <#channel>`
`/config logs public-channel <#channel>`

<blockquote>Enable or disable logging in the set log channel or the public channel.</blockquote>
**Usages:**

`/config logs enable <type>`
`/config logs disable <type>`

#### 🚯 Auto-Moderation Rules Configuration

<blockquote>Enable or disable NSFW Filter or Word Filter.</blockquote><br>

**Usages:**

`/config filters enable <filter>`
`/config filters disable <filter>`

#### Verification airlock

<blockquote>Setup your airlock channel to setup task such as giving the role when you react ✅ or do nothing by reacting with ✅ to the message the new member sent to get verified. All their messages will be deleted at the end.</blockquote><br>

**Usages:**

`/config verification-airlock set <channel> <role> (katua-result-channel)`
`/config verification-airlock enable`
`/config verification-airlock disable`

#### Show actual config

<blockquote>Be aware of what are the current configuration of Katua in your guild.</blockquote><br>

**Usages:**

`/config show`
`/config show logging`
`/config show filters`
