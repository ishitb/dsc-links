const Post = require("../models/Post");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all Posts
// @route   GET /api/v1/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };

  const removeFields = ["select", "sort", "limit", "page"];

  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  query = Post.find(JSON.parse(queryStr));

  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Post.countDocuments();

  query = query.skip(startIndex).limit(limit);

  const post = await query;

  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res
    .status(200)
    .json({
      success: true,
      count: post.length,
      pagination: pagination,
      data: post,
    });
});

// @desc    Get single Post
// @route   GET /api/v1/posts/:id
// @access  Public
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({ succes: true, data: post });
});

// @desc    Create a post
// @route   POST /api/v1/posts/
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  const post = await Post.create(req.body);

  res.status(201).json({
    success: true,
    data: post,
  });
});

// @desc    Update a post
// @route   PUT /api/v1/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({ success: true, data: post });
});

// @desc    Delete a post
// @route   DELETE /api/v1/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findByIdAndDelete(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({ success: true, data: {} });
});
