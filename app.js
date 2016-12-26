'use strict';

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!');
});

app.post('/search', jsonParser, (req, res) => {
  let event = req.body.events[0];

  let eventType = event.type;
  let msgType = event.message.type;
  let msg = event.message.text;
  let rplyToken = event.replyToekn;

  res.status(200).send('Ok');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listen on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
