const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
const openai = new OpenAIApi(configuration);

function openAIOptions(temp){
    if(temp<0 || temp>1){
        console.log("Wrong temperature defined. Defaulting to 0.5");
        temp=0.5;
    }
    const prompt = "Best opening lines for dating apps. Try these to start the conversation. 1.";
    return {
        prompt: prompt,
        temperature: temp,
        max_tokens: 280,
        top_p: 1,
        best_of: 3,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        stop: ["You:", "What's your name"],
    };
}

async function openAICall(engine, promptObject){
    const response1 = await openai.createCompletion(engine, promptObject);
    if (response1.err) { console.log('error');}
    else {
        // GPT3 generation is accessed at response1.data.choices[0].text
        return response1.data.choices[0].text;
    }
}

for(let i=0; i<50; i++){
    openAICall("text-davinci-001", openAIOptions(0.8)).then(function(response){
    // openAICall("text-davinci-001", openAIOptions(Math.random())).then(function(response){
        const cleanLine = response.replaceAll('"','').trim();
        // console.log(cleanLine);
        fs.appendFile('gpt3-tues2.txt', cleanLine+"\n", function(err){
            if (err) throw err;
        });
    });
    setTimeout(function(){}, (90)*1000); // wait 60 seconds
}