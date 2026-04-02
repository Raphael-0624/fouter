import time
from typing import Tuple
import redis.asyncio as redis


class TokenBucketLimiter:
    """Token bucket rate limiter using Redis."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.lua_script = """
            local key = KEYS[1]
            local rate = tonumber(ARGV[1])
            local burst = tonumber(ARGV[2])
            local now = tonumber(ARGV[3])

            local last_tokens = redis.call('hget', key, 'tokens')
            local last_updated = redis.call('hget', key, 'updated')

            if not last_tokens then
                last_tokens = burst
                last_updated = now
            else
                last_tokens = tonumber(last_tokens)
                last_updated = tonumber(last_updated)
                local delta = math.max(0, now - last_updated)
                local tokens_to_add = delta * rate
                last_tokens = math.min(burst, last_tokens + tokens_to_add)
            end

            local allowed = 0
            if last_tokens >= 1 then
                last_tokens = last_tokens - 1
                allowed = 1
            end

            redis.call('hset', key, 'tokens', last_tokens)
            redis.call('hset', key, 'updated', now)
            redis.call('expire', key, math.ceil(burst / rate) + 1)

            return {allowed, last_tokens}
        """

    async def is_allowed(self, key: str, rate: float, burst: int) -> Tuple[bool, int]:
        """Check if request is allowed."""
        now = time.time()
        result = await self.redis.eval(
            self.lua_script, 1, key, str(rate), str(burst), str(now)
        )
        return result[0] == 1, int(result[1])

    async def check_limits(
        self, user_key: str, provider_id: str,
        user_rate: int = 1, user_burst: int = 60,
        provider_rate: int = 5, provider_burst: int = 10
    ) -> Tuple[bool, dict]:
        """Check all three levels of rate limiting."""
        details = {
            "user_allowed": True, "user_remaining": 0,
            "provider_allowed": True, "provider_remaining": 0,
        }

        user_allowed, user_remaining = await self.is_allowed(
            f"rate_limit:user:{user_key}", user_rate, user_burst
        )
        details["user_allowed"] = user_allowed
        details["user_remaining"] = user_remaining

        if not user_allowed:
            return False, details

        prov_allowed, prov_remaining = await self.is_allowed(
            f"rate_limit:provider:{provider_id}", provider_rate, provider_burst
        )
        details["provider_allowed"] = prov_allowed
        details["provider_remaining"] = prov_remaining

        if not prov_allowed:
            return False, details

        return True, details
