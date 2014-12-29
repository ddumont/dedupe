(function () {
  "use strict";

	var fs = require('fs'),
	    walk = require('walk'),
	    path = require('path'),
	    args = process.argv.slice(2),
	    root = args.shift();

	if (!root)
		throw new Error('No path specified.');

	var stats = fs.statSync(root);
	if (!stats.isDirectory())
	  throw new Error('Path must be a directory.');

	var map = {}, // map of file sizes to array of paths with that size
	    walker = walk.walk(root);
	
	// Follow directories
	walker.on("directories", function (root, dirStatsArray, next) {
    next();
  });

	walker.on("file", function (root, stats, next) {
		var loc = path.join(root, stats.name);

		if (!map[stats.size])
    	map[stats.size] = [];
    map[stats.size].push(loc);
		next();
  });

  walker.on("end", function () {
    Object.keys(map).forEach(function(size) {
    	var files = map[size];
    	if (files.length > 1) {
    		console.log('Duplicates found:');
    		files.forEach(function(file) {
    			console.log('  ' + file);
    		});
    	}
    });
    console.log("all done");
  });
})();