const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const bcrypt = require("bcrypt");
app.use(express.json());
let db = null;
let dbPath = path.join(__dirname, "userData.db");

const initialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Connected at localhost");
    });
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
};
initialiseDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = `select * from user where username='${username}';`;
  const userResult = await db.get(query);

  if (userResult !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 4) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addQuery = `insert into user (username,name,password,gender,location)
       values ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(addQuery);

      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let userfound = `
    select * from user where username='${username}';`;
  let userres = await db.get(userfound);
  if (userres === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let decryptpass = await bcrypt.compare(password, userres.password);
    if (decryptpass === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const query = `select * from user where username='${username}';`;
  const loginResult = await db.get(query);
  const isMatch = await bcrypt.compare(oldPassword, loginResult.password);
  if (isMatch === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 4) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newHashed = await bcrypt.hash(newPassword, 10);

      const updateQuery = `update user set password = '${newHashed}' where username='${username}';`;
      await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
