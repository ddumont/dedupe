(function () {
  "use strict";

	var fs = require('fs'),
	    walk = require('walk'),
	    path = require('path'),
	    digest = require('digest-stream'),
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
  	var sizes = Object.keys(map);

    function nextSize() {
    	var size = sizes.shift();
    	while (size && map[size].length < 2)
    		size = sizes.shift();
    	if (!size)
    		return console.log("all done");

    	nextFile(size, {});
    }

    function nextFile(size, summap) {
    	var file = map[size].shift();
    	if (!file)
    		return report(size, summap);

    	var sum,
			    rstream = fs.createReadStream(file),
		      dstream = digest('md5', 'hex', function(result) {
		   	  	sum = result;
		      });
       
			rstream
			  .pipe(dstream)
				.on('error', function(error) {
					console.error(error);
				})
				.on('data', function (data) { })
				.on('end', function() {
			    if (!summap[sum])
			    	summap[sum] = [];
			    summap[sum].push(file);
			    nextFile(size, summap);
				});
    }

    function report(size, summap) {
    	Object.keys(summap).forEach(function(sum) {
	    	var files = summap[sum];
	    	if (files.length > 1) {
	    		console.log('Duplicates found. size:[' + size + '] sum:['+ sum + ']');
	    		files.forEach(function(file) {
	    			console.log('  ' + file);
	    		});
	    	}
	    });
    	nextSize();
    }

    nextSize();
  });
})();