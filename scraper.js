'use strict';
const fs = require('fs');
const Xray = require('x-ray');
const x = Xray();
const json2csv = require('json2csv');
const dateFormat = require('dateformat');

let now = new Date();

let today = dateFormat(now, 'isoDateTime').slice(0,10);
let errorDate = dateFormat(now, 'dddd, mmmm dS, yyyy, h:MM:ss TT');	

// Checks if directory 'data' exists
if(!fs.existsSync('data')) {

	// If directory does not exist, create 'data' directory
	fs.mkdirSync('data');
}

// Logs current date & error to scrapper-error.log when an error occurs
const errorLogging = (err) => {
	fs.appendFileSync('scrapper-error.log', '\n[' + errorDate + ']' + err, 'utf8');
	throw err;
};

// Scrapes link which leads to /shirts.php
x('http://shirts4mike.com', 'div.button a@href')((err, mainObj) => {
	if(err) errorLogging(err);

	// Crawls to /shirts.php & Scrape each shirt link
	x(mainObj, ['ul.products li a@href'])((err, objURL) => {
		if(err) errorLogging(err);

		// json2csv will use this to setup column headers
		let fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];

		// callsReamaining ensures scraping is complete before proceeding any further
		let callsRemaining = objURL.length;
		let data = [];

		// Crawls to each shirt URL & Creates objects from scraping
		for(let i = 0; i < objURL.length; i++) {
			x(objURL[i], 'html', {
				Title: 'title',
				Price: 'div.shirt-details span.price',
				ImageURL: 'div.shirt-picture img@src'
			})((err, objShirts) => {
				if(err) errorLogging(err);

				objShirts.URL = objURL[i]; 
				objShirts.Time = new Date(); 
				--callsRemaining;
				data.push(objShirts);

				// Once all scraping has completed convert json2csv & write to a file of today's date
				if(callsRemaining === 0) {
					let result = json2csv({data: data, fields: fields});
					fs.writeFile('data/' + today + '.csv', result);
				}
			});	
		}
	});
});

/*

	The npm package X-ray has a healthy download rate ( comparative to other web scrapers I found ) with a passing build.
	Addtionally, the X-ray sraper was very easy to pickup with comprehensible docs. Its selector API allows for scoping & also has jquery like targeting.
	Targeting element attributes is also easy to do and intuitive. Furthermore, as part of the assignment the scraper must visit the home page of shirts4mike.com & follow links to all the t-shirts -
	X-ray has crawling capabilities which allowed me to accomplish this.

	json2csv has all dependencies up to date with a passing build and 100% coverage. Frequent updates are also made to this package, with the last being as recent as a week ago.
	json2csv is not as popular & powerful as the npm package CSV, but json2csv has met my specific needs sufficiently.
	What json2csv may lack in intricate capability it makes up for with simplicity.  

*/

