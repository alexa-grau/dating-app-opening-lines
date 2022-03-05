const express = require('express');
const path = require('path');
const personalized = require("./personalizedGPT3");
const PUBLIC_DIR = './public';

const app = express();
const PORT = process.env.PORT || 8080;
let jsonDatabase = require("./database.json");
let session = {id:0, likes:[], dislikes:[], personalLikes:[]};

app.use(express.json());

app.get('/', function(req, res) {
    res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, '/index.html'));
});

app.get('/:page', function(req, res) {
    if(req.params.page==='favicon.ico') return res.status(200);
    res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, `/${req.params.page}.html`));
});

app.get('/assets/:asset', function(req,res){
    res.status(200).sendFile(path.join(__dirname, PUBLIC_DIR, `/assets/${req.params.asset}`));
});

app.get('/openingLines/:lines', function(req,res){
    if(req.params.lines==='all') res.status(200).json({session, jsonDatabase});
    else if(req.params.lines==='user') res.status(200).json({session});
    else if(req.params.lines==='new'){
        const spawn = require("child_process").spawn;
        const pythonProcess = spawn('python3',["./helloWorld.py"]);
        pythonProcess.stdout.on('data', (data) => {
            cleanedLine = data.toString().replace(/(\r\n|\n|\r|")/gm, "");
            return res.status(200).send(cleanedLine);
        });
    } else res.writeStatus(404);
});

app.post('/openingLines/:lines', function(req,res){
    if(req.params.lines==='personalized') personalized.handleRequest(req, res);
    else if(req.params.lines==='all' || req.params.lines==='user'){
        if(req.body.session) session = req.body.session;
        if(req.body.updatedLikesDislikes){
            jsonDatabase[req.body.updatedLikesDislikes.line].likes += req.body.updatedLikesDislikes.changeLikes;
            jsonDatabase[req.body.updatedLikesDislikes.line].dislikes += req.body.updatedLikesDislikes.changeDislikes;
        }
        // memory persistence?
    } else res.status(404);
});

// app.get('/favicon.ico', function(req,res){
//     return res.status(200);
// })

app.listen(PORT, ()=>{
    console.log("Listening on port "+PORT);
})
  
// function getSession(req, res) {
//     const clientCookies = req.headers.cookie || "";
//     const userId = clientCookies.split("; ")
//       .map(cookie => cookie.split("="))
//       .filter(cookie => cookie[0] === "id")
//       .reduce((acc, cookie) => cookie[1], "") || generateUniqueId(res);
//     return (sessions[userId] = sessions[userId] || { id: userId });
//   }

// function generateUniqueId(res) {
//     const id = crypto.randomBytes(16).toString("hex");
//     if (sessions[id]) {
//         return generateUniqueId();
//     }
//     res.setHeader("Set-Cookie", [`id=${id}; Path=/`]);
//     return id;
// }