const { generatePostIdeas } = require('../services/aiService');

exports.getInstagramPosts = (req, res) => {
  const ideas = generatePostIdeas('Instagram');
  res.json({
    platform: 'instagram',
    posts: [
      { id: 1, title: 'Feed post', status: 'published' },
      { id: 2, title: 'Reel idea', status: 'scheduled' }
    ],
    aiSuggestions: ideas
  });
};
