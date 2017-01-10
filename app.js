'use strict';

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const express = require('express');
const app = express();
const https = require('https');
const http = require('http');
const fs = require('fs');

const pttConfigs = JSON.parse(fs.readFileSync('configs/ptt-rocks.json', 'utf8'));
const lineConfigs = JSON.parse(fs.readFileSync('configs/line.json', 'utf8'));

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!');
});

app.post('/search', jsonParser, (req, res) => {
  try {
    let event = req.body.events[0];
    let type = event.type;
    let msgType = event.message.type;
    let msg = event.message.text;
    let rplyToken = event.replyToken;
    if (type == 'message' && msgType == 'text') {
      let tmp = msg.split(" ");
      let command = tmp[0];
      if (command != "看看鄉民怎麼說$") {
	// do nothing
      } else {
        msg = msg.substring(8, msg.length); 
        pttSearch(pttConfigs, msg, rplyToken);
      }
    }
  } catch(e) {
    console.log(e.toString());
  } finally {
    res.status(200).send('success');
  } 
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listen on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

function wsWrapper(protocol, queryOptions, postBody, replyToken, callback) {
  let request = protocol.request(queryOptions, (response) => {
    response.setEncoding('utf8');
    let body = '';
    response.on('data', (chunk) => {
      body += chunk;
    });
    response.on('end', () => {
      //console.log(body);
      if (callback)	
        callback(body, replyToken);	    
    });
  });
  request.on('error', (e) => {
    console.log('Request error: ' + e.message);
  });
  request.end(JSON.stringify(postBody));  
}

function pttSearch(queryOptions, text, replyToken) {
  let postBody = {title: text, content: text, href: 'LarryLineBOTTest'};
  wsWrapper(http, queryOptions, postBody, replyToken, pttSearchCallback);
}

function pttSearchCallback(body, replyToken) { 
  let articles = [];
  let rspBody = JSON.parse(body);
  // Check if excellent articles existed
  if (rspBody.excellent-articles.length > 0) {
    rspBody['excellent-articles'].forEach((item, idx, arr) => {
      articles.push(item);
    });	  
  }

  // Check if best-match existed
  if (rspBody['best-match']) {
    articles.unshift(rspBody['best-match']);	  
  }

  // Check if articles existed
  if (rspBody.articles.length > 0) {
    for (let idx = 0; idx < rspBody.articles.length; idx ++) {
      if (idx == 3) break;
      else articles.push(rspBody.articles[idx]); 
    }	  
  }
  sendLineMsg(replyToken, articles);
}

function sendLineMsg(replyToken, articles) {
  let postBody = {replyToken: replyToken,messages:[]};
  if (articles.length == 0) {
    postBody.messages.push({type:"text",text:"沒找到相關的文章..."});
  } else {
    let carouselBasic = {type:"template",altText:"看看鄉民怎麼說",template:{type:"carousel",columns:[]}};	
    articles.forEach((article, idx, arr) => {
      carouselBasic.template.columns.push(genLineTemplateMsg(article));
    });	  
    postBody.messages.push(carouselBasic);
  }
  wsWrapper(https, lineConfigs, postBody, null, null);
}

function genLineTemplateMsg(article) {
  let template = {
    thumbnailImageUrl: 'https://www.dropbox.com/s/dmrwmyyw6hp1qdl/11015840_1557646181157478_8853225998901111357_n.jpg?dl=1',
    title: article.title,
    text: '作者：' + article.author,
    actions: [
      {
	type: 'uri',
	label: '點擊閱讀',
	uri: postUrl(article.id),
      }
    ]
  };
  return template;
}

function postUrl(id) {
  let board_id = id.split(":");
  let board = board_id[0];
  let file = board_id[1] + ".html";
  return "https://www.ptt.rocks/share/" + board + '/' + file;
}
