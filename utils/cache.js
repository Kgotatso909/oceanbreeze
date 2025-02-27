// utils/cache.js

// Set availability cache in Redis
const setAvailabilityCache = (roomId, availabilityData) => {
    const cacheKey = `availability:${roomId}`;
    redisClient.setex(cacheKey, 3600, JSON.stringify(availabilityData)); // Cache expires in 1 hour
};

// Get availability cache from Redis
const getAvailabilityCache = async (roomId) => {
    const cacheKey = `availability:${roomId}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    return null; // Return null if no cached data found
};

module.exports = { setAvailabilityCache, getAvailabilityCache };
