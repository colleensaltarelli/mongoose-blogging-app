const mongoose = require('mongoose');

// this is our schema to represent a blog post
const blogPostSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
      firstName: String,
      lastName: String
  },
  content: {type: String, required: true}
});

// this is an *instance method* which will be available on all instances
// of the model. This method will be used to return an object that only
// exposes *some* of the fields we want from the underlying data
blogPostSchema.methods.apiRepr = function() {

  return {
    id: this._id,
    title: this.title,
    author: this.author.firstName + this.author.lastName,
    content: this.content,
  };
}

// note that all instance methods and virtual properties on our
// schema must be defined *before* we make the call to `.model`.
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = {BlogPost};
