import path from "path";
import { LLM } from "llama-node";
import { LLamaCpp } from "llama-node/dist/llm/llama-cpp.cjs"
import express from "express";

let app = express();
let port = 3000;
app.use(express.static(","));

const llama = new LLM(LLamaCpp);
const config = {
    modelPath: "llama-2-7b-chat.ggmlv3.q4_0.bin",
    enableLogging: true,
    nCtx: 1024,
    seed: 0,
    f16Kx: false,
    logitsAll: false,
    vocabOnly: false,
    useMlock: false,
    embedding: false,
    useMmap: true,
    nGpuLayers: 0
};
const template = `How are you?`;

const person_info = 'Joey is a 35-year old man that enjpys upbeat K-Pop.';

const how_is_person_feeling = `Hi I'm feeling quite upset today I couldn't get much sleep last night and now I'm all tired. I exercised really hard last night and my entire body is sore. Also I got into a fight last night with my friends and I feel really bad now.`;

const prompt = `A chat between a user and an assistant. ${person_info}
USER: Output the person's emotions as JSON format. Do NOT include any other text or explanations. End the conversation after this turn. ${how_is_person_feeling}
ASSISTANT:{"\feeling\": [`;

const prompt2 = `A chat between a user and an assistant. ${person_info}
USER: Output a list of songs that this person may enjoy listening to make them feel better. This MUST be in JSON format. Do NOT include any other text or explanations. End the conversation after this turn. ${how_is_person_feeling}
ASSISTANT:{"songs": [{"artist": "Hello", "title: "World},`;

async function main() {
    await llama.load(config);

}


async function run() {
    await llama.load(config);

    let output = "{\"feelings\": [";
    await llama.createCompletion({
        nThreads: 4,
        nTokPredict: 2048,
        topK: 40,
        topP: 0.1,
        temp: 0.2,
        repeatPenalty: 1,
        prompt: prompt2,
    }, (response) => {
            //process.stdout.write(response.token);
            //if (response.token === "USER")
                //throw "yay";
            if (response.token.includes("<end>"))
                output += response.token;
    });

        console.log(JSON.parse(output));
} 

app.listen(port, () => {
    main()
});