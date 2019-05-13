import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import { twil, wit } from './config/secret';

// create twilio instances 
const client = require('twilio')(twil.SID, twil.Token);
const MessagingResponse = require('twilio').twiml.MessagingResponse;

// create wit
const { Wit, log } = require('node-wit');

// Get a database reference to our posts
var admin = require("firebase-admin");
var serviceAccount = require("./config/key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://vrfest-757e1.firebaseio.com"
});
var db = admin.database();
var refItems = db.ref('food/');
// create our instances
const app = express();
const router = express.Router();

// set our port to either a predetermined port number if you have set it up, or 3001
const API_PORT = process.env.API_PORT || 3001;

// now we should configure the API to use bodyParser and look for JSON data in the request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));

// sending cold message functionality
router.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
  // testing purpose
  client.messages
    .create({
      body: 'Hi! How can I help you today?',
      from: '+18317095768',
      to: '1xxxxxxxxxx' //your phone number
    })
});

// send to a registered number a greeting
router.post('/phone', (req, res) => {
  let phone = req.query.phone;
  phone = "+" + phone;
  client.messages
    .create({
      body: 'Hi! How can I help you today?',
      from: '+18317095768',
      to: phone
    })
});

// text reponse
router.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const witClient = new Wit({ accessToken: wit.Token });
  witClient.message(req.body.Body, {})
    .then((data) => {
      let intent = data.entities.intent ? data.entities.intent[0].value : 'empty';
      console.log('Yay, got Wit.ai response: ' + intent);
      // location functionality to be implemented
      if (intent == 'food-location-specific') {
        var val = [];
        refItems.on('child_added', function (snap) {
          val = [...val, snap.val()];
          twiml.message('\n' + 'Here\'s a location I found:' + '\n' + snap.val().name + '\n' + snap.val().phoneNumber + '\n' + snap.val().address);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        });
      } else if (intent == 'food') {
        let randArray = ['food1', 'food2'];
        let randomItem = randArray[Math.floor(Math.random() * randArray.length)];
        db.ref(`food_no_loc/${randomItem}`).once('value', function (snapshot) {
          twiml.message('\n' + 'Here\'s a location I found:' + '\n' + snapshot.val().name + '\n' + snapshot.val().phoneNumber + '\n' + snapshot.val().address);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        });
      } else if (intent == 'shelter') {
        db.ref('shelter/shelter1').once('value', function (snapshot) {
          twiml.message('\n' + 'Here\'s a location I found:' + '\n' + snapshot.val().name + '\n' + snapshot.val().phoneNumber + '\n' + snapshot.val().address);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        });
      } else {
        if (intent == 'greeting') {
          twiml.message('\n' + 'Hi! How can I help you today?');
        } else if (intent == 'greeting-end') {
          twiml.message('\n' + 'Goodbye! Have a nice day!');
        } else if (intent == 'thank') {
          twiml.message('\n' + `We're here to help!`);
        } else {
          twiml.message('\n' + 'I\'m not sure I understand. Are you in need of food or a shelter?');
        }
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
      }
    })
    .catch(console.error);
});

// Use our router configuration when we call /api
app.use('/', router);

app.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}`));
