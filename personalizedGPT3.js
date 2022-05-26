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

function openAIOptions(specialinfo, temp, userID="test"){
    if(temp<0 || temp>1){
        temp=0.5;
    }
    return {
        prompt: createPrompt(specialinfo),
        temperature: temp,
        max_tokens: 280/4,
        top_p: 1,
        // best_of: 3,
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
    let optionsCounter = optionsArr.length-1;
    while(specialInfoToUse.length<numLines){
        if(optionsCounter<0) optionsCounter = optionsArr.length-1;
        info = JSON.parse(optionsArr[optionsCounter--]);
        if(info.interests || info.standOuts) specialInfoToUse.push(info);
    }
    return specialInfoToUse;
}

function getPersonalizedLines(numLines, temp=0.5, lineInfo, set, userID){
    if(numLines==0){
        return Promise.resolve(set);
    } else {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        return openAICall(openai, "text-davinci-001",openAIOptions(lineInfo[numLines-1], temp)).then(function(response){
            set.add(response);
            return getPersonalizedLines(numLines-1, temp, lineInfo, set);
        });
    }
}

// For profiles and more, prompt created on front end
function getResponsesFromPrompt(numLines, temp=0.5, prompt="", set){
    if(numLines==0){
        return Promise.resolve(set);
    } else {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        let tokens = 280/4;
        let freqPen=0.5, presencePen=0.5, topP=1;
        if(numLines==1){
            // more like this numbers
            tokens = 256;
            freqPen=2;
            presencePen=2;
            topP=0.43;
        }
        const promptObj = {
            prompt: prompt,
            temperature: temp,
            max_tokens: tokens,
            top_p: topP,
            frequency_penalty: freqPen,
            presence_penalty: presencePen,
        };

        return openAICall(openai, "text-davinci-001",promptObj).then(function(response){
            set.add(response);
            return getResponsesFromPrompt(numLines-1, temp, prompt, set);
        });
    }
}

function handleRequest(req, res, session){
    if(req.method !== "POST"){
        // probs redundant since server only calls from post, but figured it's worth adding
        res.writeHead(405, {'Content-Type': 'text/html'});
        return res.end("405 Method Not Allowed");
    }
    let responses = {"responses": []};
    let set = new Set();
    switch(req.params.content){
        case "opening-lines":
            responses = {"responses": []};
            set = new Set();
            const combos = processAllCombos(req.body.interests, req.body.standOuts);
            const lineInfo = loadRandomOptions(5,combos);
            return getPersonalizedLines(5, req.body.temperature, lineInfo, set, session.id).then(function(response){
                if(set.size>0) responses.responses=Array.from(set);
                res.writeHead(200, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify(responses));
            }).catch(function(err){
                console.log(err);
            });
        case "profile":
            responses = {"responses": []};
            set = new Set();
            // this should work assuming I successfully adapted getPersonalizedLines
            return getResponsesFromPrompt(5, 0.7, req.body.prompt, set).then(function(response){
                if(set.size>0) responses.responses=Array.from(set);
                res.writeHead(200, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify(responses));
            }).catch(function(err){
                console.log(err);
            });
        case "more":
            responses = {"responses": []};
            set = new Set();
            // this should work assuming I successfully adapted getPersonalizedLines
            return getResponsesFromPrompt(1, 0.7, req.body.prompt, set).then(function(response){
                if(set.size>0) responses.responses=Array.from(set);
                res.writeHead(200, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify(responses));
            }).catch(function(err){
                console.log(err);
            });
        default:
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found");
    }
}

module.exports = {
    getPersonalizedLines,
    handleRequest
}