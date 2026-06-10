import React from 'react';

const PostCard = ({ title, description, publishedAt }) => {
  return (
    <article className="post-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="post-card-date">{publishedAt}</span>
    </article>
  );
};

export default PostCard;
