const { generatePostIdeas } = require('../services/aiService');

exports.getTiktokPosts = (req, res) => {
  const ideas = generatePostIdeas('TikTok');
  res.json({
    platform: 'tiktok',
    posts: [
      { id: 1, title: 'Short video idea', status: 'draft' },
      { id: 2, title: 'Trend challenge', status: 'scheduled' }
    ],
    aiSuggestions: ideas
  });
};
