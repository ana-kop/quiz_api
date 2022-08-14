// This file contains the server-side calls for accessing the data from the database.


/*Reference: 
The code provided in class for CEGE0043 by Claire Ellul served as a prototype for the code to be found in this file. This code by Claire Ellul can be found in the 
following GitHub repositories: https://github.com/ucl-geospatial/cege0043-2020-examples-api. Since a large proportion of the code in this file came from this source, 
it will not be further referenced in this file, but instead, unless stated otherwise, one can assume that the code in this file was adapted or reproduced 
from the repositories above. 
(In a small number of cases where no reference is given and the specific code did not originate from these repositories, it can be assumed the code was 
produced by the developer who wrote these files, using only said developer's own knowledge.)
*/


var express = require('express');
var pg = require('pg');
var geoJSON = require('express').Router(); 
var fs = require('fs');
var configtext = "" + fs.readFileSync("/home/kopytina/certs/postGISConnection.js");



// now convert the configruation file into the correct format -i.e. a name/value pair array 
var configarray = configtext.split(",");
var config = {};
for (var i = 0; i < configarray.length; i++) {
var split = configarray[i].split(':');
config[split[0].trim()] = split[1].trim(); }
var pool = new pg.Pool(config); 
console.log(config);

geoJSON.route('/testGeoJSON').get(function (req,res) { 
	res.json({message:req.originalUrl});
});





geoJSON.get('/questionsAddedWithinLastWeek', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

// now use the inbuilt geoJSON functionality
// and create the required geoJSON format using a query adapted from here
// http://www.postgresonline.com/journal/archives/267-Creating-GeoJSON- Feature-Collections-with-JSON-and-PostGIS-functions.html, accessed 4th January 2018
// note that query needs to be a single string with no line breaks so built it up bit by bit
// to overcome the polyhedral surface issue, convert them to simple geometries

// QUESTIONS FROM PAST 7 DAYS
    querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type , ST_AsGeoJSON(lg.location)::json As geometry, ";
    querystring += " row_to_json((SELECT l FROM (SELECT id, question_title, question_text, answer_1, answer_2, answer_3, answer_4, user_id, correct_answer) As l ))";
    querystring += "  As properties FROM cege0043.quizquestions As lg where timestamp > NOW()::DATE-EXTRACT(DOW FROM NOW())::INTEGER-7 limit 100  ) As f ";

console.log(querystring);
client.query(querystring,function(err,result){
//call `done()` to release the client back to the pool
done();
if(err){
console.log(err); res.status(400).send(err);}
// remove the extra [ ] from the GeoJSON as this won't work with QGIS
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); 
}); // end of the geoJSON query
});
});

// the ID column name isn't in the list - so there is some attempt at injection 
// else {
//     res.status(400).send("Invalid ID column name")};
//     )
// });





geoJSON.get('/fiveDifficultQuestions/', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

    querystring = "select array_to_json(array_agg(d)) from (select c.* from cege0043.quizquestions c inner join (select count(*) as incorrectanswers, question_id ";
    querystring += " from cege0043.quizanswers where answer_selected <> correct_answer group by question_id order by incorrectanswers desc limit 5) b on b.question_id = c.id) d; ";


console.log(querystring);
client.query(querystring,function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});





geoJSON.get('/fiveClosestQuestions/:latitude/:longitude', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

var XXX = req.params.latitude;
var YYY = req.params.longitude;

// 5 CLOSEST QUESTIONS
    querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type , ST_AsGeoJSON(lg.location)::json As geometry, ";
    querystring += " row_to_json((SELECT l FROM (SELECT id, question_title, question_text, answer_1, answer_2, answer_3, answer_4, user_id, correct_answer) As l )) As properties ";
    querystring += " FROM (select c.* from cege0043.quizquestions c inner join (select id, st_distance(a.location, st_geomfromtext('POINT("+XXX+" "+YYY+")',4326)) as distance ";
    querystring += " from cege0043.quizquestions a order by distance asc limit 5) b on c.id = b.id ) as lg) As f";

console.log(querystring);
client.query(querystring,function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); // end of the geoJSON query
 // the ID column name isn't in the list - so there is some attempt at injection 
});
});
});





geoJSON.get('/dailyParticipationRatesAll/', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

    querystring = "select array_to_json(array_agg(c)) from (select day, sum(questions_answered) as questions_answered, sum(questions_correct) as questions_correct ";
    querystring += " from cege0043.participation_rates group by day) c ";

console.log(querystring);
client.query(querystring,function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});



geoJSON.get('/dailyParticipationRates/:user_id', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

var user_id = req.params.user_id;

    var querystring = " select array_to_json (array_agg(c)) from (select * from cege0043.participation_rates where user_id = $1) c ";

console.log(querystring);
client.query(querystring,[user_id],function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});





geoJSON.get('/topFiveScorers/', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}


    querystring = "select array_to_json(array_agg(c)) from (select rank() over (order by num_questions desc) as rank , user_id from (select COUNT(*)  ";
    querystring += " AS num_questions, user_id from cege0043.quizanswers where answer_selected = correct_answer group by user_id) b limit 5) c; ";
 
console.log(querystring);
client.query(querystring ,function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});





geoJSON.get('/geoJSONUserId/:user_id', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

var user_id = req.params.user_id;

var colnames = "id, question_title, question_text, answer_1, answer_2, answer_3, answer_4, user_id, correct_answer";
console.log("colnames are " + colnames);

var querystring = " SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM ";
querystring += "(SELECT 'Feature' As type , ST_AsGeoJSON(lg.location)::json As geometry, ";
querystring += "row_to_json((SELECT l FROM (SELECT "+colnames + " ) As l )) As properties";
querystring += " FROM cege0043.quizquestions As lg where user_id = $1 limit 100) As f ";


console.log(querystring);
client.query(querystring,[user_id], function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); // end of the geoJSON query
 // the ID column name isn't in the list - so there is some attempt at injection 
});
});
});





geoJSON.get('/userQuestions/:user_id', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

var user_id = req.params.user_id;

    var querystring = " select array_to_json (array_agg(c)) from (SELECT COUNT(*) AS num_questions from cege0043.quizanswers ";
    querystring += " where (answer_selected = correct_answer) and user_id = $1) c; ";

console.log(querystring);
client.query(querystring,[user_id],function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});



geoJSON.get('/userRanking/:user_id', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

var user_id = req.params.user_id;


    var querystring = " select array_to_json (array_agg(hh)) from (select c.rank from (SELECT b.user_id, rank()over (order by num_questions desc) as rank ";
    querystring += " from (select COUNT(*) AS num_questions, user_id from cege0043.quizanswers where answer_selected = correct_answer group by user_id) b) c ";
    querystring += " where c.user_id = $1) hh ";


console.log(querystring);
client.query(querystring,[user_id],function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});




geoJSON.get('/lastFiveQuestionsAnswered/:user_id', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

var user_id = req.params.user_id;

    var querystring = " SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type , ST_AsGeoJSON(lg.location)::json ";
    querystring += " As geometry, row_to_json((SELECT l FROM (SELECT id, question_title, question_text, answer_1, answer_2, answer_3, answer_4, user_id, correct_answer, ";
    querystring += " answer_correct) As l)) As properties FROM (select a.*, b.answer_correct from cege0043.quizquestions a inner join ";
    querystring += " (select question_id, answer_selected=correct_answer as answer_correct from cege0043.quizanswers where user_id = $1 order by timestamp desc limit 5) ";
    querystring += " b on a.id = b.question_id) as lg) As f ";

    // created_at => timestamp

console.log(querystring);
client.query(querystring,[user_id],function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});




geoJSON.get('/questionsNotAnswered/:user_id', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

var user_id1 = req.params.user_id;
var user_id2 = req.params.user_id;


    var querystring = " SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM (SELECT 'Feature' As type , ST_AsGeoJSON(lg.location)::json As geometry, ";
    querystring += " row_to_json((SELECT l FROM (SELECT id, question_title, question_text, answer_1, answer_2, answer_3, answer_4, user_id, correct_answer) As l  )) As properties ";
    querystring += " FROM (select * from cege0043.quizquestions where id in (select question_id from cege0043.quizanswers where user_id = $1 and answer_selected <> correct_answer ";
    querystring += " union all select id from cege0043.quizquestions where id not in (select question_id from cege0043.quizanswers) and user_id = $2)) as lg) As f ";

console.log(querystring);
client.query(querystring,[user_id1, user_id2],function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});






geoJSON.get('/allQuestions/', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

    querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type , ST_AsGeoJSON(lg.location)::json As geometry, ";
    querystring += " row_to_json((SELECT l FROM (SELECT id, question_title, question_text, answer_1, answer_2, answer_3, answer_4, user_id, correct_answer) As l ))";
    querystring += "  As properties FROM cege0043.quizquestions As lg) As f ";


console.log(querystring);
client.query(querystring,function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}
var geoJSONData = JSON.stringify(result.rows);
geoJSONData = geoJSONData.substring(1);
geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1); 
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); });
    });
});



module.exports = geoJSON;