const express = require('express');
const { getInstagramPosts } = require('../controllers/instagramController');

const router = express.Router();

router.get('/posts', getInstagramPosts);

module.exports = router;
