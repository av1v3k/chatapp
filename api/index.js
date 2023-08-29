const express = require("express");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const ws = require("ws");

const User = require("./models/User");
const Message = require("./models/Message");

const port = process.env.PORT || 4040;
const MONGO_URL = process.env.MONGO_URL;
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credential: true,
    origin: process.env.CLIENT_URL,
  })
);

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}

/** Connect MongoDB */
mongoose
  .connect(MONGO_URL)
  .then(() => console.log(`${MONGO_URL} - connected successfully`))
  .catch((err) => console.log(err));

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userid;
  let messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });

  // messages = messages.map(x => {
  //   return {...x, userid: x?.id}
  // })
  console.log(messages);

  res.json(messages);
});

app.get("/people", async (req, res) => {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

/** GET - /profile */
app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

/** POST - /login */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passok = bcrypt.compareSync(password, foundUser.password);
    if (passok) {
      jwt.sign(
        { userid: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: foundUser._id,
            username,
          });
        }
      );
    }
  }
});

app.post("/logout", async (req, res) => {
  res.cookie("token", '', { sameSite: "none", secure: true }).json('ok');
});

/** POST - /register */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username,
      password: hashedPassword,
    });
    await jwt.sign(
      { userid: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createdUser._id,
            username,
          });
      }
    );
  } catch (e) {
    if (e) throw e;
    res.status(500).json({ error: e });
  }
});

const server = app.listen(port, () => {
  console.log(`Server running in ${port}`);
});

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connection, req) => {


  function notifyPeopleAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userid: c.userid,
            username: c.username,
          })),
        })
      );
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();

    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyPeopleAboutOnlinePeople();
      console.log("dead");
    }, 1000);
  }, 5000);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  //read username and id from the cookies for this connection
  const cookies = req?.headers?.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          // console.log(userData);
          const { userid, username } = userData;
          connection.userid = userid;
          connection.username = username;
        });
      }
    }
  }

  connection.on("message", async (msg) => {
    const message = JSON.parse(msg);
    const { recipient, text } = message;
    if (recipient && text) {
      const messageDoc = await Message.create({
        sender: connection.userid,
        recipient,
        text,
      });
      [...wss.clients]
        .filter((c) => c.userid === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection?.userid,
              recipient,
              _id: messageDoc._id,
            })
          )
        );
    }
  });


  //notify everyone about online people (when someone connects)
  notifyPeopleAboutOnlinePeople();
});

wss.on("close", (data) => {
  console.log("disconnect", data);
});
