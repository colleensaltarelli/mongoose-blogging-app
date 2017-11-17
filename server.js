const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {blogPosts} = require('./models');

const app = express();
app.use(bodyParser.json());

app.get('/blog', (req, res) => {

});

app.get('/blog/:id', (req, res) => {

});

app.put('/blog/:id', (req, res) => {

});

app.delete('/blog/:id', (req, res) => {
    
});

app.use('*', function(req, res) {
    res.status(404).json({message: 'Not Found'});
  });
  



  let server;
  
  function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  
    return new Promise((resolve, reject) => {
      mongoose.connect(databaseUrl, err => {
        if (err) {
          return reject(err);
        }
        server = app.listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
      });
    });
  }
  
  function closeServer() {
    return mongoose.disconnect().then(() => {
       return new Promise((resolve, reject) => {
         console.log('Closing server');
         server.close(err => {
             if (err) {
                 return reject(err);
             }
             resolve();
         });
       });
    });
  }


if (require.main === module) {
    runServer().catch(err => console.error(err));
  };
 
module.exports = {app, runServer, closeServer};