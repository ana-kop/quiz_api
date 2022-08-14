//CRUD stands for Create, Read, Update, Delete

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
var crud = require('express').Router();
var fs = require('fs');
var configtext = ""+fs.readFileSync("/home/kopytina/certs/postGISConnection.js");

// now convert the configruation file into the correct format -i.e. a name/value pair array 
var configarray = configtext.split(",");
var config = {};
for (var i = 0; i < configarray.length; i++) {
var split = configarray[i].split(':');
config[split[0].trim()] = split[1].trim();
}

var pool = new pg.Pool(config); 
console.log(config);

const bodyParser = require('body-parser'); 
crud.use(bodyParser.urlencoded({ extended: true }));

//test endpoint for GET requests (can be called from a browser URL or AJAX) 
crud.get('/testCRUD',function (req,res) {
res.json({message:req.originalUrl+" " +"GET REQUEST"}); 
});
// test endpoint for POST requests - can only be called from AJAX 
crud.post('/testCRUD',function (req,res) {
res.json({message:req.body}); 
});




crud.get('/getUserId', function (req,res) {
pool.connect(function(err,client,done) { if(err){
console.log("not able to get connection "+ err); res.status(400).send(err);}

var querystring = "select user_id from ucfscde.users where user_name = current_user";

console.log(querystring);
client.query(querystring,function(err,result){
done();
if(err){
console.log(err); res.status(400).send(err);}

var geoJSONData = JSON.stringify(result.rows);
console.log(geoJSONData); 
res.status(200).send(JSON.parse(geoJSONData)); 
});
});
});



crud.post('/insertQuizPoint',function(req,res){
    pool.connect(function(err,client,done) {
        if(err){
            console.log("not able to get connection "+ err);
            res.status(400).send(err);}

        var longitude = req.body.longitude ;
        var latitude =  req.body.latitude ;
        var question_title =  req.body.question_title ;
        var question_text =  req.body.question_text ;
        var answer_1 = req.body.answer_1;
        var answer_2 = req.body.answer_2;
        var answer_3 = req.body.answer_3;
        var answer_4 = req.body.answer_4;
        var correct_answer = req.body.correct_answer;

        var geometryString = "st_geomfromtext('POINT(" +req.body.longitude +" " + req.body.latitude+")',4326)";

        var querystring = "INSERT into cege0043.quizquestions (question_title, question_text, answer_1, answer_2, answer_3, answer_4, correct_answer, location) values ";
        querystring += "($1,$2,$3,$4,$5,$6,$7,";
        querystring += geometryString + ")";


        client.query(querystring, [question_title, question_text, answer_1, answer_2, answer_3, answer_4, correct_answer],
            function(err,result) {
                done();
                if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send("Your question has been saved. Please refresh the webpage to see it on the map.");
           });

    });
});




crud.post('/deleteQuestion',(req,res) => {
	pool.connect(function(err,client,done) {
        if(err){ res.status(400).send(err);       }
    var id =  req.body.id ;
    var querystring = "DELETE from cege0043.quizquestions where id = $1";
    client.query( querystring,[id],function(err,result) {
                    done();
                    if(err){ res.status(400).send(err); }     
                    res.status(200).send("If this question was created by you, then question with ID "+ id+ " has been deleted.  If you did not create this question, then no change has been made");
             });
      });
});



crud.post('/insertQuizAnswers',function(req,res){
    pool.connect(function(err,client,done) {
        if(err){
            console.log("not able to get connection "+ err);
            res.status(400).send(err);}

        var question_id =  req.body.question_id;
        var correct_answer = req.body.correct_answer;
        var answer_selected = req.body.answer_selected;


        var querystring = "INSERT into cege0043.quizanswers (question_id, answer_selected, correct_answer) values ("; 
        querystring += "$1,$2,$3)";


        client.query(querystring, [question_id, answer_selected, correct_answer],
            function(err,result) {
                done();
                if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send("Answer data has been inserted");
           });

    });
});



module.exports = crud;