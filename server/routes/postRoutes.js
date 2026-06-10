const express = require('express');
const postController = require('../controllers/postController');

const router = express.Router();

router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.post('/', postController.createPost);
router.put('/:id', postController.updatePost);
router.patch('/:id', postController.updatePost);
router.post('/:id/regenerate', postController.regenerateContent);
router.delete('/:id', postController.deletePost);

module.exports = router;
