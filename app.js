const dotenv = require('dotenv');
dotenv.config();

var async = require('async');
var fs = require('fs');
var pg = require('pg');


const express = require('express')
const app = express()

var http = require('http').createServer(app);

const bodyParser = require('body-parser')
app.use(express.json())

var config = {
    user: process.env.USER,
    password:process.env.PASSWORD,
    host: process.env.HOST,
    database: 'defaultdb',
    port: 26257,
    ssl: {
        ca: fs.readFileSync('certs/ca.crt').toString(),
    }
};




app.post('/getId', function(req, res) { //GET ID GIVEN USERNAME
    let search = req.body.username;
    console.log("/getId: " + search);
    var pool = new pg.Pool(config);

    pool.connect(function (err, client, done) {
        var finish = function () {
            done();
            process.exit();
        };
        if (err) {
            console.error('could not connect to cockroachdb', err);
            finish();
        }
        async.waterfall([
            async function () {
            },
            async function (results) {
            },
            function (results, next) {
                client.query('SELECT id, username from users', next);
            },
        ],
        function (err, results) {
            if (err) {
                res.send(err)
            }
            var found = false;
            results.rows.forEach(function (row) {
                if(row.username == search){
                    res.send(row.id);
                    found = true;
                }
            });
            if(found == false){
                res.send("-1")
            }
        });
    });
});

app.post('/getData', function(req, res) { //GIVEN USERNAME, GET DATA 
    let search = req.body.username;
    console.log("/getData: " + search);
    let result = [];
    var pool = new pg.Pool(config);

    pool.connect(function (err, client, done) {
        var finish = function () {
            done();
            process.exit();
        };
        if (err) {
            console.error('could not connect to cockroachdb', err);
            finish();
        }
        async.waterfall([
            async function () {
            },
            async function (results) {
            },
            function (results, next) {
                client.query('SELECT * FROM users INNER JOIN data ON user_id = users.id;', next);
            },
        ],
        function (err, results) {
            if (err) {
                res.send(err)
            }
            results.rows.forEach(function (row) {
                if(row.username == search){
                    result.push({"time": row.time_created, "bps" : row.bps})
                }

            });
            res.send(result);
        });
    });
});


app.post('/addBlinkData', function(req, res) { //GIVEN ID, ADD BLINKRATE 
    let id = req.body.id;
    id = id.replace("\n","")
    let bps = Number(req.body.bps);
    console.log("/addBlinkData: " + id + " : " + bps) 
    var pool = new pg.Pool(config);


    pool.connect(function (err, client, done) {
        var finish = function () {
            done();
            process.exit();
        };

        if (err) {
            console.error('could not connect to cockroachdb', err);
            finish();
        }
        async.waterfall([
            async function () {
                await client.query(`
                create table if not exists users (
                    id serial primary key, 
                    username text,
                    password text
                );`);

                await client.query(`
                create table if not exists data (
                    id serial primary key, 
                    time_created timestamptz default now(), 
                    bps int, 
                    user_id int, 
                    foreign key (user_id) references users(id)
                );`);
            },
            async function (results) {
                await client.query('insert into data (bps, user_id) values (' + bps + ',' + id + ');');
                res.send("OK");
            }
        ])
    });
});


app.post('/addUser', function(req, res) { //GIVEN USERNAME AND PASSWORD, ADD USER
    let user = req.body.username;
    let pass = req.body.password;
    console.log("/addUser: " + user + " : " + pass);
    var pool = new pg.Pool(config);


    pool.connect(function (err, client, done) {
        var finish = function () {
            done();
            process.exit();
        };

        if (err) {
            console.error('could not connect to cockroachdb', err);
            finish();
        }
        async.waterfall([
            async function () {
                await client.query(`
                create table if not exists users (
                    id serial primary key, 
                    username text,
                    password text
                );`); 

                await client.query(`
                create table if not exists data (
                    id serial primary key, 
                    time_created timestamptz default now(), 
                    bps int, 
                    user_id int, 
                    foreign key (user_id) references users(id)
                );`);
            },
            async function (results) {
                await client.query("insert into users (username, password) values ('" + user + "','" + pass + "');");
                res.send("OK");
            }
        ])
    });
});



app.delete('/deleteAll', function(req, res) { 
    console.log("/deleteAll") 
    var pool = new pg.Pool(config);


    pool.connect(function (err, client, done) {
        var finish = function () {
            done();
            process.exit();
        };

        if (err) {
            console.error('could not connect to cockroachdb', err);
            finish();
        }
        async.waterfall([
            async function () {
                await client.query(`drop table if exists data;`);
                await client.query(`drop table if exists users;`);

                await client.query(`
                create table if not exists users (
                    id serial primary key, 
                    username text,
                    password text
                );`);

                await client.query(`
                create table if not exists data (
                    id serial primary key, 
                    time_created timestamptz default now(), 
                    bps int, 
                    user_id int, 
                    foreign key (user_id) references users(id)
                );`);

                res.send("OK");
            }
        ])
    });
});


app.post('/login', function(req, res) { //Given Username and Password, Return True and False
    let user = req.body.username;
    let pass = req.body.password;
    console.log("/login: " + user + " : " + pass);
    var pool = new pg.Pool(config);

    pool.connect(function (err, client, done) {
        var finish = function () {
            done();
            process.exit();
        };
        if (err) {
            console.error('could not connect to cockroachdb', err);
            finish();
        }
        async.waterfall([
            async function () {
            },
            async function (results) {
            },
            function (results, next) {
                client.query('SELECT id, username, password from users', next);
            },
        ],
        function (err, results) {
            if (err) {
                res.send(err)
            }
            var found = false;
            results.rows.forEach(function (row) {
                if(row.username == user && row.password == pass){
                    res.send({"Response": true});
                    found = true;
                }
            });
            if(found == false){
                res.send({"Response": false});
            }
        });
    });
});




http.listen(process.env.PORT || 8888, function() {
    console.log('listening on *:8888');
});