const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.post('/generate', aiController.generateContent);
router.post('/generate-hashtags', aiController.generateHashtags);
router.post('/generate-media', aiController.generateMedia);

module.exports = router;
