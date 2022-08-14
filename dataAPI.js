// This file contains the code required to start the API.

/*Reference: 
The code provided in class for CEGE0043 by Claire Ellul served as a prototype for the code to be found in this file. This code by Claire Ellul can be found in the 
following GitHub repositories: https://github.com/ucl-geospatial/cege0043-2020-examples-api. Since a large proportion of the code in this file came from this source, 
it will not be further referenced in this file, but instead, unless stated otherwise, one can assume that the code in this file was adapted or reproduced 
from the repositories above. 
(In a small number of cases where no reference is given and the specific code did not originate from these repositories, it can be assumed the code was 
produced by the developer who wrote these files, using only said developer's own knowledge.)
*/

// express is the server that forms part of the nodejs program
var express = require('express'); // like a package for node.js
var path = require("path");
var app = express();
var fs = require('fs'); // file system

// add an https server to serve files 
var http = require('http');
var https = require('https');
var httpServer = http.createServer(app); // initialise an instance of an app
httpServer.listen(4480);

app.get('/',function (req,res) { // when there is a request, run this function
res.send("hello world from the Data API");
});

// adding CORS 
app.use(function(req, res, next) {
res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); 
next();
});

// adding functionality to log the requests 
app.use(function (req, res, next) {
var filename = path.basename(req.url);
var extension = path.extname(filename); 
console.log("The file " + filename + " was requested."); 
next();
});

const geoJSON = require('./routes/geoJSON'); 
app.use('/', geoJSON);

const crud = require('./routes/crud'); 
app.use('/', crud);

// TEST - https://128.16.82.46/api/testCRUD?name=ANASTASIA&surname=KOPYTINA