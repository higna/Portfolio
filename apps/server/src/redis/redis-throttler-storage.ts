import { Inject, Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.constants';

type StorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

const INCREMENT_SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local totalHits = redis.call('INCR', hitsKey)
if totalHits == 1 then redis.call('PEXPIRE', hitsKey, ttl) end
local timeToExpire = redis.call('PTTL', hitsKey)
local isBlocked = redis.call('EXISTS', blockKey) == 1
local timeToBlockExpire = 0

if isBlocked then
  timeToBlockExpire = redis.call('PTTL', blockKey)
elseif totalHits > limit and blockDuration > 0 then
  redis.call('SET', blockKey, 1, 'PX', blockDuration)
  isBlocked = true
  timeToBlockExpire = blockDuration
end

return { totalHits, timeToExpire, isBlocked and 1 or 0, timeToBlockExpire }
`;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClientType) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<StorageRecord> {
    const hitsKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:${throttlerName}:block:${key}`;
    const result = (await this.client.eval(INCREMENT_SCRIPT, {
      keys: [hitsKey, blockKey],
      arguments: [String(ttl), String(limit), String(blockDuration)],
    })) as [number, number, number, number];

    const [totalHits, timeToExpire, blocked, timeToBlockExpire] = result;
    return {
      totalHits,
      timeToExpire,
      isBlocked: blocked === 1,
      timeToBlockExpire,
    };
  }
}
