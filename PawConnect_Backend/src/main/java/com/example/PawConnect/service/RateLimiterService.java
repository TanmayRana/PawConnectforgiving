package com.example.PawConnect.service;

import java.time.Duration;

public interface RateLimiterService {

    /**
     * Checks if a request can be permitted under the rate limit policy.
     *
     * @param key         unique identifier for the caller/action (e.g., "login:127.0.0.1" or "register:user@example.com")
     * @param maxRequests maximum allowed requests within the time window
     * @param window      duration of the sliding rate limit window
     * @return true if the request is permitted, false if rate limited
     */
    boolean tryAcquire(String key, int maxRequests, Duration window);

    /**
     * Resets any rate limiting record for the specified key.
     */
    void reset(String key);
}
