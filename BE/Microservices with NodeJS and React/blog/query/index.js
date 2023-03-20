const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(bodyParser.json());

/**
 * @type Record<string, { 
  id: string, 
  title: string, 
  comments: Array<{ 
    id: string, 
    content: string 
    status: string
    }> 
  }>
 */
const posts = {};

const handleEvent = (type, data) => {
  if (type === "PostCreated") {
    const { id, title } = data;

    posts[id] = { id, title, comments: [] };
  }

  if (type === "CommentCreated") {
    const { postId, ...rest } = data;

    const post = posts[postId];
    post.comments.push({
      ...rest,
    });
  }

  if (type === "CommentUpdated") {
    const { postId, id, content, status } = data;

    let comment = posts[postId].comments.find((c) => c.id === id);

    comment.content = content;
    comment.status = status;
  }
};

app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/events", (req, res) => {
  const { type, data } = req.body;

  handleEvent(type, data);

  res.send({});
});

app.listen(4002, () => {
  console.log("Listening on 4002");

  axios
    .get("http://event-bus-srv:4005/events")
    .then((res) => {
      for (let event of res.data) {
        console.log("Processing event:", event.type);
        handleEvent(event.type, event.data);
      }
    })
    .catch((e) => console.error(e.message));
});
