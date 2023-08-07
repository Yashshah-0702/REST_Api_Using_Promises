const { validationResult } = require("express-validator");
const Post = require("../models/post");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");

// Get Post(read)
// Using async/await
exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  // let totalItems;
  try{
    const totalItems = await Post.find()
    .countDocuments()
    const posts = await Post.find()
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

    res.status(200).json({
      message: "Posts Found",
      post: posts,
      totalItems: totalItems,
    });
  }
  catch(err){
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  // Using Promises
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((result) => {
      res.status(200).json({
        message: "Posts Found",
        post: result,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// Create Post (create)
exports.createPosts = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Creating post failed...!");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image found...!");
    error.statusCode = 422;
    throw error;
  }
  const imageurl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const post = new Post({
    title: title,
    content: content,
    imageurl: imageurl,
    creator: req.userId,
  });
  post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Post Created Successfully",
        post: result,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// Read a single product
exports.getPost = (req, res, next) => {
  const postsId = req.params.postsId;
  Post.findById(postsId)
    .then((posts) => {
      if (!posts) {
        const error = new Error("No Product Found...!");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        post: posts,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// Update post (update)
exports.updatePosts = (req, res, next) => {
  const postsId = req.params.postsId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Updating post failed...!");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageurl = req.body.image;
  if (req.file) {
    imageurl = req.file.path;
  }
  if (!imageurl) {
    const error = new Error("No file picked...");
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postsId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404;
        throw error;
      }
      if(post.creator.toString()!== req.userId){
        const error = new Error("Not Authorized");
        error.statusCode = 403;
        throw error;
      }
      if (imageurl !== post.imageurl) {
        clearImage(post.imageurl);
      }
      post.title = title;
      post.imageurl = imageurl;
      post.content = content;
      console.log(imageurl);
      return post.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "post updated",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePosts = (req, res, next) => {
  const postsId = req.params.postsId;
  Post.findById(postsId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found...");
        error.statusCode = 422;
        throw error;
      }
      if(post.creator.toString()!== req.userId){
        const error = new Error("Not Authorized");
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageurl);
      return Post.findByIdAndRemove(postsId);
    }).then(result=>{
      return User.findById(req.userId)
    }).then(user=>{
      user.posts.pull(postsId)
      return user.save()
    })
    .then((result) => {
      res.status(200).json({ message: "Post Deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
