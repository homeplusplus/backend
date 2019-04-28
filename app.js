import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import { twil, wit } from './config/secret';

// create twilio instances 
const client = require('twilio')(twil.SID, twil.Token);
const MessagingResponse = require('twilio').twiml.MessagingResponse;

// create wit
const { Wit, log } = require('node-wit');

// create our instances
const app = express();
const router = express.Router();

// set our port to either a predetermined port number if you have set it up, or 3001
const API_PORT = process.env.API_PORT || 3001;

// now we should configure the API to use bodyParser and look for JSON data in the request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));


// now we can set the route path & initialize the API
router.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
  // client.messages
  // .create({
  //     body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
  //     from: '+18317095768',
  //     to: '+14087992849'
  // })
  // .then(message => console.log(message.sid))

});

// test reponse
router.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const witClient = new Wit({ accessToken: wit.Token });
  witClient.message(req.body.Body, {})
    .then((data) => {
      let intent = data.entities.intent ? data.entities.intent[0].value : 'empty';
      console.log('Yay, got Wit.ai response: ' + intent);
      if (intent == 'food') {
        twiml.message('You want some food?');
      } else if (intent == 'shelter') {
        twiml.message('You need a shelter?')
      } else if (intent == 'greeting') {
        twiml.message('Hi! How can I help you today?');
      } else if (intent == 'greeting-end') {
        twiml.message('Goodbye! Have a nice day!');
      } else if(intent == 'thank'){
        twiml.message(`We're here to help!`);
      } else {
        twiml.message('Common commands: Food, Shelter');
      }
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    })
    .catch(console.error);
});

// Use our router configuration when we call /api
app.use('/api', router);

app.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}`));