# Middleware Redis Keys Migration

## Overview

This document provides guidance on the standardization of Redis keys used for middleware configuration storage. We've updated the system to use a consistent naming scheme and data format to avoid type conflicts and WRONGTYPE errors.

## Key Changes

The key changes in this migration:

1. **Standardized Redis key names**:
   - Changed from `middleware:active` to `middleware:config:active`
   - Used consistent naming scheme across all middleware-related keys

2. **Consistent data formats**:
   - All active middleware configurations are now stored as JSON strings
   - Removed use of Redis lists for middleware configuration to prevent type conflicts

## Verification

To verify that your Redis instance has the correct key structure, run:

```
node verify-middleware-keys.js
```

This script will check all middleware-related keys and report any issues.

## Fix Script

If you encounter issues with Redis key types or middleware configuration, run the fix script:

```
node fix-middleware-config.js
```

This script will:
1. Remove any legacy keys
2. Create consistent JSON string format for middleware configurations
3. Set default configurations if none exist

## Common Issues

### WRONGTYPE Error

If you see a `WRONGTYPE Operation against a key holding the wrong kind of value` error, it typically means:

1. The application is trying to access a Redis key with one type of operation (e.g., JSON string) but the key exists with a different type (e.g., list)
2. There are legacy keys in the Redis database that need to be updated

Solution: Run the `fix-middleware-config.js` script to standardize all keys.

### No Active Middleware

If no middleware is loading, check:

1. The `middleware:config:active` key exists in Redis
2. It contains a valid JSON array of middleware names
3. Each middleware name corresponds to a configuration in `middleware:config:item:[name]`

Solution: Run the `inspect-redis-middleware.js` script to examine the current middleware configuration.

## Key Structure Reference

The standardized Redis key structure is:

- `middleware:config:list`: A Redis SET containing all middleware configuration keys
- `middleware:config:item:[name]`: A Redis STRING containing the JSON configuration for a middleware
- `middleware:config:active`: A Redis STRING containing a JSON array of active middleware names
