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

let formData = {
  field1: "initial value1 from server",
  field2: "initial value2 from server",
};

io.on("connection", (socket) => {
  console.log(socket.id + " is connected");

  socket.on("form-edit", (formDataReq) => {
    // console.log(`message from ${socket.id} : ${message}`);
    if (JSON.stringify(formData) !== JSON.stringify(formDataReq)) {
      formData = {
        ...formDataReq,
      };

      socket.broadcast.emit("update-form", formData);
    }
  });

  socket.on("disconnect", () => {
    console.log(`socket ${socket.id} disconnected`);
  });
});

const socketIOMiddleware = (req, res, next) => {
  req.io = io;

  next();
};

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// -----  service workers -----
app.post(
  "/subscription",
  subscriptionHandler.handlePushNotificationSubscription
);
app.get("/subscription/:id", subscriptionHandler.sendPushNotification);

// -----  socket.io form editing -----

app.get("/form", socketIOMiddleware, (req, res) => {
  res.status(200).json(formData);
});

app.post("/form", socketIOMiddleware, (req, res) => {
  const { body } = req;
  if (JSON.stringify(body) !== JSON.stringify(formData)) {
    req.io.broadcast.emit("update-form", body);
  }
  res.status(200).json(formData);
});

server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
