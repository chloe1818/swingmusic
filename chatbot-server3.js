import http from "http";
import { Server } from "socket.io";
import express, { text } from "express";
import core_ai from "./core-ai3.js";
import search from "youtube-search-api";
import nlp from 'compromise';
import Sentiment from 'sentiment';


let app = express();
let server = http.createServer(app);
let io = new Server(server);

app.use(express.static("."));
app.use(express.json());

const sentiment = new Sentiment();

let input = [];

io.on("connection", (socket) => {
    let systemPrompt = "You are a helpful, respectful, and honest assistant. Answer concisely and do not use emojis in your output.";
    let messageHistory = `[INST]
    <<SYS>>
    ${systemPrompt}
    <</SYS>>
    User: `;

    socket.on("user-info", (message) => {
        messageHistory = `[INST]
        <<SYS>>
        ${systemPrompt}
        ${message}
        <</SYS>>
        User: `;
    })

    // [inst] <<sys>> ... ... <</sys>>  user [/inst]  response ... [inst] user 2 [/inst] response...
    socket.on("chat-message", (message) =>{
        input.push(message);
        messageHistory += message + " [/INST]";
        core_ai.generate(messageHistory, (token) => {
            console.log(token);
            socket.emit("chat-token", token);
        }).then((fullMessage) => {
            messageHistory += fullMessage + " [INST]\nUser:";
            socket.emit("chat-finished", fullMessage);
        });

    });

    async function youtube(searches) {
        let res = [];
        for (let i of searches) {
            let p = await search.GetListByKeyword(i, false, 10, [{ type: "video" }]);
            console.log(p);
            socket.emit("youtube-result", p);
            res.push(p);
        }
        return res;
    }

    socket.on("suggest-videos", () => {
        const result = sentiment.analyze(extractUserMessages(input));
        console.log(result.score);
        let msg;
        if(result.score<0) {
            msg = messageHistory + `Suggest some happy, upbeat songs with positive words for me based on the conversation that we just had in JSON format. The format should go as such: { "songs": [ { "artist": "Artist name here", "title": "Title of the song goes here." } } ] [/INST] { "songs": [ { "artist": "Hello", "title": "World" }, `;
            console.log("happy song");
        }
        else{
            msg = messageHistory + `Suggest some songs for me based on the conversation that we just had in JSON format. The format should go as such: { "songs": [ { "artist": "Artist name here", "title": "Title of the song goes here." } } ] [/INST] { "songs": [ { "artist": "Hello", "title": "World" }, `;
            console.log("song");
          }

        core_ai.generate(msg, (token) => {
            console.log(token);
            socket.emit("chat-token", token);
        }).then((fullMessage) => {
            let json = JSON.parse(`{ "songs": [` + fullMessage);

            let searches = [];
            for (let i of json.songs) {
                searches.push(i.artist + " " + i.title);
            }

            youtube(searches);
        });
    });

    function extractUserMessages(input) {
      let text = "";
      for (let i = 0; i < input.length; i++) {
        text += input[i] + " ";
      }
      return text;
    }

});

await core_ai.init();

server.listen(3000);


