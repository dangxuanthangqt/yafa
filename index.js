const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const cors = require("cors");
const subscriptionHandler = require("./subscriptionHandler");
const http = require("http");
const socketUtils = require("./utils/socketUtils");

var port = process.env.PORT || 4000;

const app = express();

const server = http.createServer(app);

app.use(
  cors({
    origin: "*", // allow to server to accept request from different origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // allow session cookie from browser to pass through
  })
);

const io = socketUtils.sio(server);
socketUtils.connection(io);

const socketIOMiddleware = (req, res, next) => {
  req.io = io;

  next();
};

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post(
  "/subscription",
  subscriptionHandler.handlePushNotificationSubscription
);
app.get("/subscription/:id", subscriptionHandler.sendPushNotification);

app.post("/update-form", socketIOMiddleware, (req, res) => {
  const { form } = req.body;
  req.io.broadcast.emit("update-form", form);
  res.status(200).json({});
});

// app.listen(port);
// console.log('The magic happens on port ' + port);
server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
