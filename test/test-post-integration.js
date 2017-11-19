const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {TEST_DATABASE_URL} = require('../config');
const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedBlogPostData() {
    console.info('seeding blog post data');
    const seedData = [];
  
    for (let i=1; i<=10; i++) {
      seedData.push(generateBlogPostData());
    }
    // this will return a promise
    return BlogPost.insertMany(seedData);
  }

// generate an object represnting a blog post.
// can be used to generate seed data for db
// or request.body data
function generateBlogPostData() {
    return {
        title: faker.lorem.words(),
        content: faker.lorem.paragraph(),
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
    }
  }
}

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure  ata from one test does not stick
// around for next one
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blog Posts API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedblogPostData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  })

  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function() {
    
        it('should return all existing blog posts', function() {
          // strategy:
          //    1. get back all blog posts returned by by GET request to `/posts`
          //    2. prove res has right status, data type
          //    3. prove the number of blog posts we got back is equal to number
          //       in db.
          //
          // need to have access to mutate and access `res` across
          // `.then()` calls below, so declare it here so can modify in place
          let res;
          return chai.request(app)
            .get('/posts')
            .then(function(_res) {
              // so subsequent .then blocks can access resp obj.
              res = _res;
              res.should.have.status(200);
              // otherwise our db seeding didn't work
              res.body.blogPosts.should.have.length.of.at.least(1);
              return BlogPost.count();
            })
            .then(function(count) {
              res.body.blogPosts.should.have.length.of(count);
            });
        });
    
    
        it('should return blog posts with right fields', function() {
          // Strategy: Get back all blog posts, and ensure they have expected keys
    
          let resBlogPost;
          return chai.request(app)
            .get('/posts')
            .then(function(res) {
              res.should.be.json;
              res.body.blogPosts.should.be.a('array');
              res.body.blogPosts.should.have.length.of.at.least(1);
    
              res.body.blogPosts.forEach(function(blogPost) {
                blogPost.should.be.a('object');
                blogPost.should.include.keys(
                  'id', 'title', 'content', 'author');
              });
              resBlogPost = res.body.blogPosts[0];
              return BlogPost.findById(resBlogPost.id);
            })
            .then(function(blogPost) {
    
              blogPost.id.should.equal(blogPost.id);
              blogPost.title.should.equal(blogPost.title);
              blogPost.content.should.equal(blogPost.content);
              blogPost.author.should.equal(blogPost.author);
            });
        });
      });
      describe('POST endpoint', function() {
        // strategy: make a POST request with data,
        // then prove that the post we get back has
        // right keys, and that `id` is there (which means
        // the data was inserted into db)
        it('should add a new post', function() {
    
          const newBlogPost = generateBlogPostData();
    
          return chai.request(app)
            .post('/posts')
            .send(newBlogPost)
            .then(function(res) {
              res.should.have.status(201);
              res.should.be.json;
              res.body.should.be.a('object');
              res.body.should.include.keys(
                'id', 'title', 'content', 'author');
              res.body.title.should.equal(newBlogPost.title);
              // cause Mongo should have created id on insertion
              res.body.id.should.not.be.null;
              res.body.content.should.equal(newBlogPost.content);
              return BlogPost.findById(res.body.id);
            })
            .then(function(blogPost) {
              blogPost.title.should.equal(newBlogPost.title);
              blogPost.content.should.equal(newBlogPost.content);
              blogPost.author.firstName.should.equal(newBlogPost.author.firstName);
              blogPost.author.lastName.should.equal(newBlogPost.author.lastName);
            });
        });
      });

});