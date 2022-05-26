const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const personalized = require("./personalizedGPT3");
const googleCloud = require("./googleCloud");
const PUBLIC_DIR = './public';

const app = express();
const PORT = process.env.PORT || 8080;
let session = {id:0, lines:[], profiles:[]};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded())
app.use(cors());

app.get('/', function(req, res) {
    res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, '/index.html'));
});

app.get('/:page', function(req, res) {
    if(req.params.page==='favicon.ico') return res.status(200);
    res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, `/${req.params.page}.html`), null, function(err){
        if(err && err.code==='ENOENT'){
            res.status(404).sendFile(path.join(__dirname, PUBLIC_DIR, `/404.html`));
        }
    });
});

app.get('/assets/:asset', function(req,res){
    res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, `/assets/${req.params.asset}`));
});

app.get('/user/saved', function(req, res){
    res.json(session);
})

app.post('/user/saved', function(req, res){
    if(req.body.content){
        let tempSet;
        if(req.body.content=='profile'){
            tempSet = [... new Set(req.body.newArr.concat(session.profiles))];
            session.profiles = Array.from(tempSet);
        } else if(req.body.content=='opening-line'){
            tempSet = [... new Set(req.body.newArr.concat(session.lines))];
            session.lines = Array.from(tempSet);
        } else if(req.body.content=='saved') {
            session.profiles = req.body.newLikedProfiles;
            session.lines = req.body.newLikedLines;
        } else {
            console.log(`Idk how to save ${req.body.content}`);
        }
    }
});

app.post('/gpt3/:content', function(req, res){
    personalized.handleRequest(req, res, session);
});

app.post('/image', function(req, res){
    // get image labels from Google vision
});

app.post('/sentiment', function(req, res){
    googleCloud.analyzeSentiment(req.body.text, res);
});

// ALWAYS stay at bottom, 404 catch all
app.get('*', function(req, res){
    res.status(404).sendFile(path.join(__dirname, PUBLIC_DIR, `/404.html`));
});

app.listen(PORT, ()=>{
    console.log("Listening on port "+PORT);
});