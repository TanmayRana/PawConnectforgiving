package com.example.PawConnect.service.impl;

import com.example.PawConnect.service.RateLimiterService;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding window rate limiter.
 * <p>
 * NOTE FOR PRODUCTION: For distributed deployments behind multiple load-balanced
 * backend instances, this in-memory implementation should be replaced with a Redis-backed
 * distributed rate limiter (e.g. Redisson or Redis Token Bucket / Bucket4j).
 */
@Service
public class InMemoryRateLimiterService implements RateLimiterService {

    private final ConcurrentHashMap<String, Deque<Instant>> requestMap = new ConcurrentHashMap<>();

    @Override
    public boolean tryAcquire(String key, int maxRequests, Duration window) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);

        Deque<Instant> timestamps = requestMap.compute(key, (k, existing) -> {
            Deque<Instant> q = (existing != null) ? existing : new ArrayDeque<>();
            // Remove timestamps older than the window cutoff
            while (!q.isEmpty() && q.peekFirst().isBefore(cutoff)) {
                q.pollFirst();
            }
            if (q.size() < maxRequests) {
                q.addLast(now);
            }
            return q;
        });

        // The request succeeded if it was admitted (size <= maxRequests and last timestamp is now)
        return timestamps.peekLast() != null && timestamps.peekLast().equals(now) && timestamps.size() <= maxRequests;
    }

    @Override
    public void reset(String key) {
        requestMap.remove(key);
    }
}
