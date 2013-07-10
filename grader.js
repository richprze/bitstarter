#!/usr/bin/env node

/*
 * Automatically grade files for the presence of specified HTML tags/attributes.
 * Uses commander.js and cheerio. Teaaches command line application development
 * and basic DOM parsing.
 *
 * References:
 *  + cheerio
 *    - https://github.com/MatthewMueller/cheerio
 *    - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
 *    - http://maxogden.com/scraping-with-node.html
 *
 *  + commander.js
 *    - https://github.com/visionmedia/commander.js
 *    - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy
 *
 *  + JSON
 *    - http://en.wikipedia.org/wiki/JSON
 *    - https://developer.mozilla.org/en-US/docs/JSON
 *    - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 */

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var util = require('util');
var rest = require('restler');
var request = require('request');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Existin.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};


var loadCheerio = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};


// parses checks.json file. in this case = array of html tags
var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    // $ = cheerio.load(htmlstring);
    $ = loadCheerio(htmlfile);

    // an array of html tags to check
    var checks = loadChecks(checksfile).sort();
    var out = {};
    // for each tag in checks array
    for(var ii in checks) {
	// test if tag is present in html file (which is in cheerio).
	// if tag from checks is present in $ (cheerio) then length 
	// will be 1 or higher. so check if length > 0
	var present = $(checks[ii]).length > 0;
	// out array where key = tag and value = true/false
	out[checks[ii]] = present;
    }
    return out;
};


var checkHtmlUrl = function(weburl, checksfile) {
    request(weburl, function(err, resp, html) {
	$ = cheerio.load(html);

	var checks = loadChecks(checksfile).sort();
	var out = {};
	// for each tag in checks array
	for(var ii in checks) {
	    // test if tag is present in html file (which is in cheerio).
	    // if tag from checks is present in $ (cheerio) then length 
	    // will be 1 or higher. so check if length > 0
	    var present = $(checks[ii]).length > 0;
	    // out array where key = tag and value = true/false
	    out[checks[ii]] = present;
	}
	var outJson = JSON.stringify(out, null, 4);
	console.log(outJson);
    });
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <web_url>', 'Website URL')
	.parse(process.argv);

    if (program.url) {
	// var checkJson = checkHtmlFile(program.file, program.checks);
	checkHtmlUrl(program.url, program.checks);
    } else { // use .file, which has a default
	// var checkJson = checkHtmlFile(program.file, program.checks);
	var checkJson = checkHtmlFile(program.file, program.checks);
	// format out array into JSON string; 4 = # spaces
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
