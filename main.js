"use strict";

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const digest = require('digest-stream');
const pickby = require('lodash.pickby');
const reduce = require('lodash.reduce');
const util = require('./util.js');

const [root] = process.argv.slice(2);
if (!root) {
  throw new Error('No path specified.');
}

fs.statAsync(root)
.then(stats => {
  if (!stats.isDirectory()) {
    throw new Error('Path must be a directory.');
  }
  return util.getFileSizeMap(root);
})
.then(map => { // Filter out files that don't have duplicate sizes
  return pickby(map, list => {
    return list.length > 1;
  });
})
.then(map => { // convert to a list of all the files
  const paths = reduce(map, (result, value, key) => {
    return result.concat(value);
  }, []);

  // convert to map of checksums -> paths
  return Promise.map(paths, path => util.checksum(path), {concurrency: 1})
  .reduce((result, sum, idx) => {
    const list = result[sum] || (result[sum] = []);
    list.push(paths[idx]);
    return result;
  }, {});
})
.then((map) => { // Filter out files that don't have duplicate sums
  return pickby(map, list => {
    return list.length > 1;
  });
})
.then(map => {
  Object.keys(map).forEach(sum => {
    console.log(`Duplicate files found. sum: ${sum}`);
    map[sum].forEach(file => console.log(`  ${file}`));
  });
});
