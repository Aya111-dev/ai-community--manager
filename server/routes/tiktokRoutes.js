const express = require('express');
const { getTiktokPosts } = require('../controllers/tiktokController');

const router = express.Router();

router.get('/posts', getTiktokPosts);

module.exports = router;
