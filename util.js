const fs = require('fs');
const path = require('path');
const walk = require('walk');
const digest = require('digest-stream');
const Promise = require('bluebird');

/**
 * @return Promise of Object<size, List<filename>>
 */
exports.getFileSizeMap = function getFiles(root) {
  const map = {};

  return new Promise((resolve, reject) => {
    const walker = walk.walk(root);

    // Follow directories
    walker.on("directories", (root, dirStatsArray, next) => {
      next();
    });

    walker.on("file", (root, stats, next) => {
      const {size, name} = stats;
      const list = map[size] || (map[size] = []);
      list.push(path.join(root, name));
      next();
    });

    walker.on("end", () => {
      resolve(map);
    });
  });
};

exports.checksum = function checksum(path) {
  console.log(`hashing: ${path}`);
  return new Promise((resolve, reject) => {
    const rstream = fs.createReadStream(path);
    const dstream = digest('md5', 'hex', result => {
       resolve(result);
    });

    rstream.pipe(dstream)
    .on('error', reject)
    .on('data', function (data) { });
  });
};
