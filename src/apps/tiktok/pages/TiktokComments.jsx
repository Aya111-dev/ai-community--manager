import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function TiktokComments() {
  const { posts, comments, addComment, updateCommentStatus } = useOutletContext();
  const [selectedPostId, setSelectedPostId] = useState(posts[0]?.id || '');
  const [newComment, setNewComment] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [openReply, setOpenReply] = useState({});

  const postOptions = posts.filter((post) => post.status === 'published' || post.status === 'scheduled');

  const commentsByPost = useMemo(
    () =>
      postOptions.map((post) => ({
        post,
        comments: comments.filter((comment) => comment.postId === post.id)
      })),
    [comments, postOptions]
  );

  const handleAddComment = () => {
    if (!newComment || !selectedPostId) return;
    addComment({ postId: selectedPostId, text: newComment, author: 'Community Manager' });
    setNewComment('');
  };

  const handleReplyToggle = (commentId) => {
    setOpenReply((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleReplySend = (commentId) => {
    const replyText = replyDrafts[commentId]?.trim();
    if (!replyText) return;
    const original = comments.find((comment) => comment.id === commentId);
    addComment({
      postId: original.postId,
      text: `Réponse : ${replyText}`,
      author: 'Community Manager'
    });
    setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    setOpenReply((prev) => ({ ...prev, [commentId]: false }));
  };

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Commentaires</h1>
          <p>Modérez et répondez rapidement à vos interactions TikTok.</p>
        </div>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>Ajouter un commentaire</h3>
            <span>Répondez à votre communauté ou ajoutez un nouveau commentaire.</span>
          </div>
        </div>

        <div className="actions-row">
          <select value={selectedPostId} onChange={(event) => setSelectedPostId(event.target.value)}>
            {postOptions.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </select>
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Écrivez un nouveau commentaire..."
          />
          <button type="button" className="button button-filled" onClick={handleAddComment}>
            Ajouter un commentaire
          </button>
        </div>
      </section>

      {commentsByPost.map(({ post, comments: postComments }) => (
        <section key={post.id} className="card">
          <div className="card-header">
            <div>
              <h3>{post.title}</h3>
              <span>{postComments.length} commentaires</span>
            </div>
            <span className={`status-pill ${post.status}`}>{post.status}</span>
          </div>

          <div className="card-list">
            {postComments.map((comment) => (
              <article key={comment.id} className="comment-card">
                <div className="comment-meta">
                  <div>
                    <span className="comment-author">{comment.author}</span>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                  <span className={`status-pill ${comment.status}`}>
                    {comment.status === 'approved'
                      ? 'Approuvé'
                      : comment.status === 'hidden'
                      ? 'Masqué'
                      : 'Supprimé'}
                  </span>
                </div>

                <div className="comment-actions">
                  <button type="button" onClick={() => updateCommentStatus(comment.id, 'approved')}>
                    Garder
                  </button>
                  <button type="button" onClick={() => updateCommentStatus(comment.id, 'hidden')}>
                    Masquer
                  </button>
                  <button type="button" onClick={() => updateCommentStatus(comment.id, 'deleted')}>
                    Supprimer
                  </button>
                  <button type="button" onClick={() => handleReplyToggle(comment.id)}>
                    Répondre
                  </button>
                </div>

                {openReply[comment.id] && (
                  <div className="reply-box">
                    <textarea
                      value={replyDrafts[comment.id] || ''}
                      onChange={(event) =>
                        setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))
                      }
                      placeholder="Écrire une réponse..."
                    />
                    <button type="button" className="button button-secondary" onClick={() => handleReplySend(comment.id)}>
                      Envoyer la réponse
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}