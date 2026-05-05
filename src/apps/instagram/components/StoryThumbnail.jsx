import React from 'react';

const StoryThumbnail = ({ story, index, onOpen }) => {
  const profileImage = '/reel-profile.svg';
  const displayAuthor = story?.author && story.author.toLowerCase() !== 'utilisateur' ? story.author : 'devaito_manager';

  return (
    <button
      type="button"
      className="ig-story-thumbnail"
      onClick={() => onOpen?.(index)}
      title={displayAuthor}
      aria-label={`Story de ${displayAuthor}`}
    >
      <div className="ig-story-gradient-ring">
  <div className="ig-story-thumb-circle">
    <img src={profileImage} alt={displayAuthor} className="ig-story-thumb-media" />
  </div>
</div>
<div className="ig-story-thumb-name">{displayAuthor}</div>
    </button>
  );
};

export default StoryThumbnail;
