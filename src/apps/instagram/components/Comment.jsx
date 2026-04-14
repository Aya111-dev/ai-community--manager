import React from 'react';

const Comment = ({ author, text }) => {
  return (
    <div className="comment-card">
      <strong>{author}</strong>
      <p>{text}</p>
    </div>
  );
};

export default Comment;
