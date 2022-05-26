// UPLOAD TO GOOGLE CLOUD BUCKET
const bucketName = 'images-bucket-296a-project';
const fileName = 'upload-'+Date.now(); // ms acts as unique id

// import Google Cloud client library and create client
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

async function uploadFile(filePath){
    const contentType = 'image/'+filePath.split('.').slice(-1);
    // console.log(contentType);
    await storage.bucket(bucketName).upload(filePath, {
        destination: fileName,
        contentType
    });

    console.log(`${filePath} uploaded to ${bucketName}`);
}

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */

// // The contents that you want to upload
// var fs = require('fs');

// async function uploadFromMemory() {
//     fs.readFile('image.jpg', function(err, data){
//         if (err) {
//             console.log(err);
//             return;
//         }
//         return await storage.bucket(bucketName).file(fileName).save(contents);
//     });
//     // await storage.bucket(bucketName).file(fileName).save(contents);

//     console.log(
//         `${fileName} with contents ${contents} uploaded to ${bucketName}.`
//     );
// }

// uploadFromMemory().catch(console.error);

// ANALYZE SENTIMENT
const emoji = require("node-emoji");
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

async function getSentiment(text){
    const document = {
        content: text,
        type: 'PLAIN_TEXT', // PLAIN_TEXT or HTML
    };

    const [result] = await client.analyzeSentiment({document});
    return result;
}

function sentimentScoreToEmotion(score, magnitude, sentiment_emoji=''){
    // https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json
    if(sentiment_emoji) return Promise.resolve(sentiment_emoji);

    // emotionally charged
    if(magnitude>1){
        if(score>0.85){
            // most positive
            sentiment_emoji=emoji.get("smiling_imp"); // 😈
        } else if(score>0.6){
            sentiment_emoji=emoji.get("heart_eyes"); // 😍
        } else if(score>0.4){
            sentiment_emoji=emoji.get("grin"); // 😁
        } else if(score>0.1){
            // still pretty clearly positive
            sentiment_emoji=emoji.get("smile"); // 😄
        } else if(score<-0.5){
            // clearly negative
            sentiment_emoji=emoji.get("rage"); // 😡
        } else if(score<-0.1){
            // still clearly negative
            sentiment_emoji=emoji.get("frowning"); // 😦
        } else {
            // mixed
            sentiment_emoji=emoji.get("face_with_raised_eyebrow"); // 🤨
        }
    }
    // low magnitude
    else {
        if(score>0.6){
            // low emotion but very positive
            sentiment_emoji=emoji.get("innocent"); // 😇
        } else if(score>0.3){
            // low emotion but positive
            sentiment_emoji=emoji.get("wink"); // 😉
        } else if(score>0.1) {
            // somewhat positive
            sentiment_emoji=emoji.get("slightly_smiling_face"); // 🙂
        } else if(score<-0.5) {
            sentiment_emoji=emoji.get("no_mouth"); // 😶
        } else if(score<-0.1){
            // somewhat negative
            sentiment_emoji=emoji.get('slightly_frowning_face'); // 🙁
        } else {
            // very low emotion
            sentiment_emoji=emoji.get("expressionless"); // 😑
        }
    }
    return sentimentScoreToEmotion(score, magnitude, sentiment_emoji);
}

function analyzeSentiment(text, res){
    return getSentiment(text).then(result => {
        return sentimentScoreToEmotion(result.documentSentiment.score, result.documentSentiment.magnitude).then(result => {
            res.send(result);
        });
    });
}

module.exports = {
    uploadFile,
    analyzeSentiment,
}

// uploadFile('/Users/alexagrau/Desktop/COEN296A/practice-cloud/images/carl.png').catch(console.error);