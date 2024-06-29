// calculate gold shards to time; 2 gold shards = 12 hours

const goldShardsToTime = (goldShards) => {
  // 2 gold shards = 12 hours

  let time = 0;

  // 2 gold shards minimum, 1 extra shard = 6 hours

  time = Math.floor(goldShards / 2) * 12;

  if (goldShards % 2 === 1) {
    time += 6;
  }

  return time;
};

module.exports = goldShardsToTime;
