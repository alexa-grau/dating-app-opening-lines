const fs = require('fs');
const http = require("http");
const url = require('url');

const allGenerations = require("./allGenerations");
// const personalized = require("./personalizedGPT3");

const sessions = {}; // global sessions variable

http.createServer(function(req, res) {
    const pathname = url.parse(req.url).pathname;
    let userSession = getSession(req, res);

    // HTML pages and client-side JS
    if (pathname === '/') {
        return fs.readFile("./public/index.html", (err, data) => handleReadFile(err, data, res));
    } else if (pathname === '/personalized') {
        switch(req.method){
            case 'GET':
                return fs.readFile("./public/personalized.html", (err, data) => handleReadFile(err, data, res));
            default:
                res.writeHead(405, {'Content-Type': 'text/html'});
	            return res.end("405 Method Not Allowed");
        }
    } else if(pathname === '/favorites'){
        return fs.readFile("./public/favorites.html", (err, data) => handleReadFile(err, data, res));
    } else if(pathname === '/about'){
        return fs.readFile("./public/about.html", (err, data) => handleReadFile(err, data, res));
    } else if(/\/assets\//.test(pathname)) {
        return fs.readFile(`./public/${pathname}`, (err, data) => handleReadFile(err, data, res));
    }
    
    // personalized, all, and user favorites requests
    else if(pathname.startsWith('/openingLines')) {
        if(pathname==="/openingLines/personalized"){
            // personalized.handleRequest(req, res)
            // changes
            res.writeHead(503, {'Content-Type': 'text/html'});
	        return res.end("503 Service Unavailable");
        } else{
            allGenerations.handleRequest(req,res,userSession);
        }
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
	    return res.end("404 Not Found");
    }
}).listen(8080);

function handleReadFile(err, data, res) {
    if (err) {
        res.writeHead(404, {'Content-Type': 'text/html'});
	    return res.end("404 Not Found");
    }  
    // found
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    return res.end(); 
}

function getSession(req, res) {
    const clientCookies = req.headers.cookie || "";
    const userId = clientCookies.split("; ")
      .map(cookie => cookie.split("="))
      .filter(cookie => cookie[0] === "id")
      .reduce((acc, cookie) => cookie[1], "") || generateUniqueId(res);
    return (sessions[userId] = sessions[userId] || { id: userId });
  }