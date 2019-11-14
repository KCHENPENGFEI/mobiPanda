
const LRUMap = require('lru_map').LRUMap;

const cache = new LRUMap(10000);
const pandaCache = new LRUMap(1000);

module.exports = {
    cache,
    pandaCache
};