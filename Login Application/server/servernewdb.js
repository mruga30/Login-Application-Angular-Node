const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 12000;
const bodyParser = require("body-parser");
const cors = require("cors");
const Sequelize = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secretKey = require("./config/keys").secretOrKey;
const validateRegisterInput = require("./validations/register");
const moment = require("moment");
const nodemailer = require("nodemailer");
const { send } = require("process");
const smtpTransport = require("nodemailer-smtp-transport");

let db = new sqlite3.Database(
  "./api/db/database4.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the in-memory SQlite database.");
  }
);

db.run(
  "CREATE TABLE IF NOT EXISTS users(name TEXT, email TEXT, password TEXT, trialAttempt INTEGER DEFAULT 0, failedAt DATE, createdAt DATE,updatedAt DATE)"
);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/forgotPassword", (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }
  db.get(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    req.body.email,
    function (err, email) {
      if (err) {
        console.log(err);
      }
      var message;
      if (email) {
        message = "Email sent.";
        console.log(message);
        // const sendmail = async (sender, receiver, text) => {
        //   //  let tester = nodemailer.createTestAccount();

        //   let transporter = nodemailer.createTransport({
        //     service: "Gmail",
        //     host: "smtp.gmail.com",

        //     secure: false,
        //     auth: {
        //       user: "bankimpatel9@gmail.com",
        //       pass: "",
        //     },
        //   });

        //   let info = {
        //     from: "bankimpatel9@gmail.com",
        //     to: "patel@gmail.com",
        //     subject: "Forgot password retrieval",
        //     text: text,
        //   };

        //   transporter.sendMail(info, (err, info) => {
        //     if (err) {
        //       console.log("ERR", err);
        //     } else {
        //       console.log(info);
        //     }
        //   });

        //   nodemailer.createTransport(info);
        // };
      } else {
        message = "User doesn't exist.";
        console.log(message);
      }
      res.json({ message: message });
    }
  );
  // User.findOne({ where: { email: req.body.email } }).then((email) => {
  //   if (!email) {
  //     return res
  //       .status(404)
  //       .json({ error: true, message: "Email does not exist" });
  //   } else {
  //     console.log("Send email");
  //     let emailSender = sendmail(
  //       "bankimpatel9@gmail.com",
  //       req.body.email,
  //       "recover your email"
  //     );
  //     console.log("Succes body: ", emailSender);
  //     return res
  //       .status(200)
  //       .json({ error: false, message: "Recovery email sent" });
  //   }
  // });
});

app.post("/login", (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ error: true, message: "Email and password is required" });
  }
  let sql = `SELECT * FROM users WHERE email = "${req.body.email}"; `; //AND password = "${hash}"`;
  var x;

  db.all(sql, (err, rows) => {
    if (err) {
      next(err);
      return;
    }
    if (!rows[0]) {
      res.status(400);
      res.send("Invalid email");
      return;
    } else {
      console.log("============PRE ATTEMPT: ", rows[0]);

      if (moment.duration(moment().diff(rows[0].failedAt)).asMinutes() >= 30) {
        let a = 0;
        let nFail = null;
        let sql2 = `UPDATE users SET trialAttempt = "${a}", failedAt=${nFail} WHERE email = "${req.body.email}" ; `;
        db.all(sql2, (err, rows) => {
          if (err) {
            next(err);
            return;
          }
        });
      }

      setTimeout(() => {
        if (rows[0].trialAttempt >= 5) {
          return res.status(400).json({
            error: true,
            msg:
              "You reached maximum attempts to login, please try again in 30 minutes",
          });
        } else {
          rows.forEach((row) => {
            bcrypt
              .compare(req.body.password, row.password)
              .then((isMatch) => {
                if (isMatch) {
                  const payload = { name: row.name, email: row.email };
                  jwt.sign(
                    payload,
                    secretKey,
                    { expiresIn: 3600 },
                    (err, token) => {
                      //set trial attempt to 0 on successful login
                      let a = 0;
                      let nFail = null;
                      let sql2 = `UPDATE users SET trialAttempt = "${a}", failedAt=${nFail} WHERE email = "${req.body.email}" ; `;
                      db.all(sql2, (err, rows) => {
                        if (err) {
                          next(err);
                          return;
                        }
                      });
                      res.json({ success: true, token: "Bearer " + token });
                    }
                  );
                  // res.json({ msg: "User logged in" });
                } else {
                  res.status(400).json({
                    msg: "User credentials are incorrect",
                    attempt: rows[0].trialAttempt,
                  });

                  let tAttempt =
                    rows[0].trialAttempt === null ? 0 : rows[0].trialAttempt;
                  let newTrialAttempt = tAttempt + 1;

                  let newTime = new moment();
                  let tStamp = Date.now();

                  let sql2 = `UPDATE users SET trialAttempt = ${newTrialAttempt}, failedAt = ${tStamp} WHERE email = "${req.body.email}" ; `; //AND password = "${hash}"`;
                  if (newTrialAttempt === 5) {
                    //   //when trialAttempt=5, set a timer
                  }
                  db.all(sql2, (err, rows) => {
                    if (err) {
                      console.log("ERR: ", err);
                      next(err);
                      return;
                    }
                    console.log("====TRIAL ATTEMP: ", rows);
                  });
                }
              })
              .catch();
          });
        }
      }, 1000);
    }
  });
});

app.post("/register", function (req, res) {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  db.serialize(() => {
    let date = new Date();
    let password;

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        console.log("salt value" + salt);
        if (err) throw err;
        req.body.password = hash;
        // console.log("pw1" + req.body.password);
        db.get(
          "SELECT * FROM users WHERE name = ? LIMIT 1",
          req.body.username,
          function (err, rowU) {
            if (rowU) {
              res.status(400).json({ msg: "Account already exists" });
            } else {
              db.get(
                "SELECT * FROM users WHERE email = ? LIMIT 1",
                req.body.email,
                function (err, rowE) {
                  if (rowE) {
                    res.status(400).json({ msg: "Account already exists" });
                  } else {
                    db.run(
                      "INSERT INTO users(name,email,password,createdAt,updatedAt) VALUES(?,?,?,?,?)",
                      [
                        req.body.username,
                        req.body.email,
                        req.body.password,
                        date,
                        date,
                      ],
                      function (err) {
                        if (err) {
                          return console.log(err);
                        }
                        console.log("New user has been added.");
                        res.json({ msg: "New user" });
                      }
                    );
                  }
                }
              );
            }
          }
        );
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`App listening on ${PORT}`);
});
