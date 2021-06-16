const path = require('path')
const nodemailer = require('nodemailer')
const randtoken = require('rand-token');
const validator = require("email-validator")
const admin = require('firebase-admin')
const fetch = require("node-fetch");
const rateLimit = require('express-rate-limit')
const cors = require('cors')
const express = require('express')
const {BetaAnalyticsDataClient} = require('@google-analytics/data');

// Load Env Variables
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

// Initialize Express
const app = express();

// Initilize the Rate Limiter
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too Many Request, Please Try Again after 1 Hour"
})

// Adding cors support
 app.use(cors({
   origin: '*',  //Origins need to be changed
   methods: 'GET',
}))

app.use(express.static(path.resolve(__dirname, '../client/build')));
app.use(express.json())
app.use(limiter)

// Initialize the admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    "projectId": process.env.Firebase_project_id,
    "private_key_id": process.env.Firebase_private_key_id,
    "private_key": process.env.Firebase_private_key,
    "client_email": process.env.Firebase_client_email,
    "client_id": process.env.Firebase_client_id,
    "auth_uri" : process.env.Firebase_auth_uri,
    "token_uri" : process.env.Firebase_token_uri,
    "auth_provider_x509_cert_url" : process.env.Firebase_auth_provider_x509_cert_url,
    "client_x509_cert_url": process.env.Firebase_client_x509_cert_url, 
  }),
  storageBucket: process.env.Firebase_Storage_Bucket,
});

// Get the Firestore Instance 
const db = admin.firestore()

// Initialize the Mail Client
var transporter = nodemailer.createTransport({
  service: process.env.Email_Service,
  auth: {
    user: process.env.Email,
    pass: process.env.password,
  }
})

// Api Connection Test
app.get("/api", limiter, (req, res) => res.sendStatus(200));

// Api Analytics
app.get("/api/Analytics", (req, res) => {
  const StartDate = req.query.StartDate;
  const EndDate = req.query.EndDate;
  if(StartDate === null || EndDate === null) return res.status(404).send('Missing Query')
  async function runReport() {
    return await new BetaAnalyticsDataClient().runReport({
      property: `properties/${process.env.propertyId}`,
      dateRanges: [{
        startDate: StartDate,
        endDate: EndDate,
      }, ],
      dimensions: [{
        name: 'dayOfWeek',
      }, ],
      metrics: [{
        name: 'eventCount',
      }, ],
    })
  }
  runReport().then((response) => res.json(response)).catch((er) => res.sendStatus(500));
})
 
// Api Analytics Reporting
app.get('/api/Analytics/Reporting', (req, res) => {
  const Name = req.query.Name
  var arr = JSON.parse(req.query.array)      //array={"foo":"bar","Polar":"Bear"}
  if(!Name) return res.status(400).send('Missing Query \'Name\'')
  fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.measurement_id}&api_secret=${process.env.api_secret}`, {
    method: "POST",
    body: JSON.stringify({
      client_id: process.env.client_id,
      events: [{
        name: Name,
        params: arr,
      }]
    })
  }).then(()=>res.sendStatus(200)).catch((er)=>{console.log(er); res.sendStatus(500)});
});

// Api for User Login
app.get('/api/login', limiter, (req, res) => {
  const userName = req.query.userName
  const password = req.query.password
  if(userName===null || password===null) return res.status(404).send('Missing Query')
  db.collection("Users").doc(userName).get()
  .then((doc) => {
    if(doc.exists) {
      if(doc.data().password == password)
        admin.auth().getUserByEmail(userName).then((userRecord) => {
          if (userRecord.emailVerified) {
            var token = randtoken.generate(16);
            db.collection("Users").doc(userName).collection('Auth_Token').get().then(snap =>
              db.collection("Users").doc(userName).collection('Auth_Token').doc((snap.size + 1).toString()).set({token})
            );
            return res.json({LoggedIn: true,reason: token.toString()});
          }
          else return res.json({LoggedIn: false,reason: 'Email not Verified'});
        })
      else return res.json({LoggedIn: false,reason: 'Invalid Password'});
    } 
    else return res.json({LoggedIn: false,reason: 'Invalid Username'});
  }).catch((e) => res.sendStatus(500));
})

// Api for Token Verify
app.get('/api/tokenverify', limiter, (req, res) => {
  const UserName = req.query.UserName;
  const Token = req.query.Token;
  if(UserName === null || Token === null) return res.status(404).send('Missing Query')
  db.collection("Users").doc(UserName).collection('Auth_Token').get()
  .then(snap => {
    var found = false;
    snap.forEach((doc) => {
      if (doc.get('token') == Token) { found = true; return res.json({verified: true});}
    })
    if (!found) return res.json({verified: false})
  }).catch(()=>res.sendStatus(500))
})

// Api to Delete User
app.get('/api/DeleteUser', limiter, (req, res) => {
  const UserName = req.query.UserName;
  if(req.query.Admin_Verification_Token != process.env.Admin_Verification_Token) return res.statusCode(400);
  if(UserName===null) return res.status(404).send('Missing Query')
  admin.auth().getUserByEmail(UserName).then((userrec) => 
    admin.auth().deleteUser(userrec.uid)
      .then(() => db.collection("Users").doc(userName).delete()
        .then(()=>res.status(200).send('Done')))
      .catch(() => res.sendStatus(500))
  ).catch(() => res.status(404).send('Non Existant'))
})

// Api to Signup a new User
app.get('/api/signup', limiter, (req, res) => {
  const userName = req.query.userName
  const password = req.query.password
  if(userName || password) return res.sendStatus(400);
  admin.auth().getUserByEmail(userName)
    .then(() => res.send({created: false, reason: 'User Already Exists'}))
    .catch(() => {
      if (!validator.validate(userName)) return res.send({created: false, reason: 'Invalid Email'});
      admin.auth()
        .createUser({
          email: userName,
          emailVerified: false,
          password: password,
        })
        .then(() => {
          admin.auth().generateEmailVerificationLink(userName).then((link) => {
            var mailOptions = {
              from: process.env.Email,
              to: userName,
              subject: 'Email Verification Link',
              html: `
                      <body style="padding: 3rem;text-align: center;background: #003973;  
                                  background: -webkit-linear-gradient(to bottom, #E5E5BE, #003973); 
                                  background: linear-gradient(to bottom, #E5E5BE, #003973); ">
                          <h1 style="font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
                                     font-size: 5rem;
                                     -webkit-text-stroke: 1px white;">Account Verification Email</h1>
                          <p style="
                                  color: aqua;
                                  font-size: 2rem;">Click <a href="${link}">here</a> to verify your email id</p>
                          <p style="
                                  color: white;">If this was not you. Discard this email</p>
                      </body> `
            }
            transporter.sendMail(mailOptions, function (error) {
              if (error) throw error;
              else console.log('Email Verification Sent to: ' + userName)
            })
          }).then(()=>{
            db.collection("Users").doc(userName).set({password: password});
            res.send({created: true, reason: 'New User Created, Check Email for verification link'})
          }).catch(() => res.sendStatus(500));
        })
        .catch(() => res.sendStatus(500));
    })
})

const PORT = process.env.PORT;
module.exports = app.listen(PORT, () => console.log(`Server listening on ${PORT}`));