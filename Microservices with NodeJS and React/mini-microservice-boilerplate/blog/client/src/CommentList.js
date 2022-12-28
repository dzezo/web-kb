const CommentList = ({ comments }) => {
  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>
          {comment.status === "approved"
            ? comment.content
            : comment.status === "rejected"
            ? "This comment has been rejected"
            : "This comment awaits moderation"}
        </li>
      ))}
    </ul>
  );
};

export default CommentList;
