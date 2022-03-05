const FILENAME = "./database.json";
const jsonDatabase = require(FILENAME);
const fs = require('fs');

function handleRequest(req, res, session){
    console.log("Handle request");
    if(req.url==="/openingLines/all"){
        switch(req.method){
            case "GET":
                console.log("Get all");
                fs.readFile(`./sessions/${session.id}`, (err, data) => {
                    // get file session content
                    let fileSession = null;
                    if (!err) {
                        fileSession = JSON.parse(data);
                    }
                    if(fileSession){
                        session.likes=fileSession.likes;
                        session.dislikes=fileSession.dislikes;
                        session.personalLikes=fileSession.personalLikes;
                    } else {
                        // no file session information
                        session.likes=new Set();
                        session.dislikes=new Set();
                        session.personalLikes=new Set();
                    }
    
                    // send opening line database and session info
                    res.writeHead(200, 'OK');
                    let jsonObj = JSON.stringify({
                        "jsonDatabase": jsonDatabase,
                        "session": {
                            id: session.id,
                            likes: Array.from(session.likes),
                            dislikes: Array.from(session.dislikes),
                            personalLikes: Array.from(session.personalLikes),
                        }
                    });
                    console.log("Sending", jsonObj);
                    return res.end(jsonObj);
                });
                break;
            case "POST":
                // parse request body
                convertRequest(req, data => {
                    // get session likes, dislikes
                    session.likes=new Set(Object.values(data.session.likes));
                    session.dislikes=new Set(Object.values(data.session.dislikes));
                    if(data.session.personalLikes)
                        session.personalLikes=new Set(Object.values(data.session.personalLikes));
                    else session.personalLikes=new Set();
                    // object to write to file
                    let jsonObj = JSON.stringify({
                        id: session.id,
                        likes: Array.from(session.likes),
                        dislikes: Array.from(session.dislikes),
                        personalLikes: Array.from(session.personalLikes)
                    });
                    // save to file
                    fs.writeFile(`./sessions/${session.id}`, jsonObj, err =>{
                        if(err){
                            res.writeHead(500, {'Content-Type': 'text/html'});
                            return res.end("500 Internal Server Error");
                        }
                        res.writeHead(200, 'OK');
                        return res.end();
                    });
                    // update database to reflect likes (for sorting)
                    if(data.updatedLikesDislikes){
                        jsonDatabase[data.updatedLikesDislikes.line].likes+=data.updatedLikesDislikes.changeLikes;
                        jsonDatabase[data.updatedLikesDislikes.line].dislikes+=data.updatedLikesDislikes.changeDislikes;
                        fs.writeFile(FILENAME, JSON.stringify(jsonDatabase), err=>{
                            if(err) console.log(err);
                        });
                    }
                });
                break;
            default:
                res.writeHead(405, {'Content-Type': 'text/html'});
                return res.end("405 Method Not Allowed");
        }
    } else if(req.url==="/openingLines/user"){
        switch(req.method){
            case "GET":
                fs.readFile(`./sessions/${session.id}`, (err, data) => {
                    // get file session
                    let fileSession = null;
                    if (!err) {
                        fileSession = JSON.parse(data);
                    }
                    if(fileSession){
                        session.likes=fileSession.likes;
                        session.dislikes=fileSession.dislikes;
                        session.personalLikes=fileSession.personalLikes;
                    } else {
                        // new session (not likely, just a catch case)
                        session.likes=new Set();
                        session.dislikes=new Set();
                        session.personalLikes=new Set();
                    }
    
                    res.writeHead(200, 'OK');
                    return res.end(JSON.stringify(session));
                });
                break;
            case "POST":
                convertRequest(req, data => {
                    // write to session
                    fs.writeFile(`./sessions/${data.session.id}`, JSON.stringify(data.session), err =>{
                        if(err){
                            res.writeHead(500, {'Content-Type': 'text/html'});
                            return res.end("500 Internal Server Error");
                        }
                        res.writeHead(200, 'OK');
                        return res.end();
                    });
                    // update database if provided
                    if(data.updatedLikesDislikes){
                        jsonDatabase[data.updatedLikesDislikes.line].likes+=data.updatedLikesDislikes.changeLikes;
                        jsonDatabase[data.updatedLikesDislikes.line].changeDislikes+=data.updatedLikesDislikes.changeDislikes;
                        fs.writeFile(FILENAME, JSON.stringify(jsonDatabase), err=>{
                            if(err) console.log(err);
                        });
                    }
                });
                break;
            default:
                res.writeHead(405, {'Content-Type': 'text/html'});
                return res.end("405 Method Not Allowed");
        }
    } else if(req.url==="/openingLines/new"){
        switch(req.method){
            case "GET":
                // run python script to generate new
                const spawn = require("child_process").spawn;
                const pythonProcess = spawn('python3',["./helloWorld.py"]);
                pythonProcess.stdout.on('data', (data) => {
                    cleanedLine = data.toString().replace(/(\r\n|\n|\r|")/gm, "");
                    res.writeHead(200, 'OK');
                    return res.end(cleanedLine);
                });
                break;
                // res.writeHead(200, 'OK');
                // return res.end(newest.line);
            default:
                res.writeHead(405, {'Content-Type': 'text/html'});
                return res.end("405 Method Not Allowed");
        }
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        return res.end("404 Not Found");
    }
}

/*
  converts the HTTP POST request body into a JSON object
*/
function convertRequest(req, callback) {
    let data = "";
    req.on('data', chunk => {
        data += chunk.toString();
    });
    req.on('end', () => {
        callback(JSON.parse(data));
    });
}

module.exports = {
    handleRequest
}