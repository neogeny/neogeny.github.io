/**
 * Returns a simple cache manager that supports a
 * FIFO cache invalidation strategy.
 *
 * @class cacheManager
 * @constructor
 * @param cacheSize the size of the cache before keys are invalidated
 */
AJS.Confluence.cacheManager = function (cacheSize) {
    var cache = {},
        cacheStack = [],
        cacheSize = cacheSize || 30;

    return {
        get: function(key) {
            return cache[key];
        },
        put: function(key, value) {
            cache[key] = value;
            cacheStack.push(key);
            if (cacheStack.length > cacheSize) {
                delete cache[cacheStack.shift()];
            }
        },
        clear : function() {
            cache = {};
            cacheStack = [];
        }
    };
};
