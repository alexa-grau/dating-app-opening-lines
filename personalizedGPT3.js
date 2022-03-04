const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const Filter = require('bad-words');
const filter = new Filter();

function createPrompt(obj){
    extraInfo = ""
    if(obj){
        if(obj.interests){
        extraInfo += " They like "+obj.interests+".";
        } if(obj.standOuts){
            extraInfo += " They "+obj.standOuts+".";
        }
    }
    // use bad-words to clean prompt before it gets sent to GPT-3
    return filter.clean("Write a dating app pickup line."+extraInfo);
}

function openAIOptions(specialinfo, temp, userID){
    if(temp<0 || temp>1){
        temp=0.5;
    }
    return {
        prompt: createPrompt(specialinfo),
        temperature: temp,
        max_tokens: 280/4,
        top_p: 1,
        best_of: 3,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        stop: ["You:", "What's your name"],
        user: userID.toString,
    };
}

async function openAICall(openai, engine, promptObject){
    const response1 = await openai.createCompletion(engine, promptObject);
    if (response1.err) { console.log('error');}
    else {
        // GPT3 generation is accessed at response1.data.choices[0].text
        return response1.data.choices[0].text;
    }
}

function processAllCombos(interestString, standoutString){
    const interests = interestString.split(","); // array of interests split by ,
    const standOuts = standoutString.split(","); // array of standouts split by ,
    specialInfoOptions = {}
    
    let numCombos = interests.length+standOuts.length+interests.length*standOuts.length;

    // individual interests and standouts
    for(interest of interests){
        let objString = JSON.stringify({"interests":interest});
        specialInfoOptions[objString]=0;
    };
    for(standout of standOuts){
        let objString = JSON.stringify({"standOuts":standout});
        specialInfoOptions[objString]=0;
    };

    // combos
    while(Object.keys(specialInfoOptions).length<numCombos){
        if(interests.length===0 && standOuts.length===0) break;
        const randomInterest = interests.splice(Math.floor(Math.random()*interests.length), 1)[0];
        const randomStandOut = standOuts.splice(Math.floor(Math.random()*standOuts.length), 1)[0];
    
        specialInfoOptions[JSON.stringify({"interests":randomInterest, "standOuts":randomStandOut})]=0;
    }

    return specialInfoOptions;
}

function loadRandomOptions(numLines, options){
    let specialInfoToUse = []
    let optionsArr = Object.keys(options);
    while(specialInfoToUse.length<numLines){
        if(optionsArr.length===0) break;
        info = optionsArr.splice(Math.floor(Math.random()*options.length), 1)[0];
        if(info) specialInfoToUse.push(JSON.parse(info));
    }
    return specialInfoToUse;
}

function getPersonalizedLines(numLines, temp=0.5, interestString="", standoutString="", set, userID){
    if(numLines==0){
        return Promise.resolve(set);
    } else {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const combos = processAllCombos(interestString, standoutString);
        const lineInfo = loadRandomOptions(numLines,combos);

        return openAICall(openai, "text-davinci-001",openAIOptions(lineInfo[numLines-1], temp, userID)).then(function(response){
            set.add(response);
            return getPersonalizedLines(numLines-1, temp, interestString, standoutString, set);
        });
    }
}

function handleRequest(req, res, session){
    switch(req.method){
        case "GET":
            // let responses = {"responses": []};
            res.writeHead(200, 'OK'); // only for now
            return res.end();
        case "POST":
            let responses = {"responses": []};
            return convertRequest(req, data => {
                let set = new Set();
                return getPersonalizedLines(5, data.temperature, data.interests, data.standOuts, set, session.id).then(function(response){
                    if(set.size>0) responses.responses=Array.from(set);
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    return res.end(JSON.stringify(responses));
                }).catch(function(err){
                    console.log(err);
                });
            });
        default:
            res.writeHead(405, {'Content-Type': 'text/html'});
            return res.end("405 Method Not Allowed");
    }
}

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
    getPersonalizedLines,
    handleRequest
}

// getPersonalizedLines();
