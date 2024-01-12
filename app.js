const express = require("express");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const server_instance = express();
const path = require("path");
const dataBasePath = path.join(__dirname, "userData.db");
server_instance.use(express.json());
let dataBase_Path = null;

const initializeDBandServer = async () => {
  try {
    dataBase_Path = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    server_instance.listen(5000, () => {
      console.log("Server is running on 5000 port");
    });
  } catch (Error) {
    console.log(`Database and server error ${Error.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

// API 1
server_instance.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const inCryptUserPassword = await bcrypt.hash(password, 10);
  const checkUserDb = `SELECT * FROM user WHERE username ='${username}';`;
  const dbUserName = await dataBase_Path.get(checkUserDb);
  if (dbUserName === undefined) {
    let addNewUserName = `INSERT INTO user(username, name, password, gender, location)
      VALUES
      (
          '${username}',
          '${name}',
          '${inCryptUserPassword}',
          '${gender}',
          '${location}'
      );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await dataBase_Path.run(addNewUserName);
      response.status(200).send("User created successfully");
    }
  } else {
    response.status(400).send("User already exists");
  }
});

// API 2
server_instance.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkLoginUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const checkLoginUserInDatabase = await dataBase_Path.get(checkLoginUserQuery);
  if (checkLoginUserInDatabase === undefined) {
    response.status(400).send("Invalid user");
  } else {
    const checkUserLoginPassword = await bcrypt.compare(
      password,
      checkLoginUserInDatabase.password
    );
    if (checkUserLoginPassword === true) {
      response.status(200).send("Login success!");
    } else {
      response.status(400).send("Invalid password");
    }
  }
});

// API 3
server_instance.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkDbUsername = `SELECT * FROM user WHERE username = '${username}';`;
  const DbCheckUserName = await dataBase_Path.get(checkDbUsername);
  console.log(DbCheckUserName);
  if (DbCheckUserName === undefined) {
    response.status(400).send("User not registered");
  } else {
    const isValidPassword = await bcrypt.compare(
      oldPassword,
      DbCheckUserName.password
    );
    if (isValidPassword === true) {
      if (newPassword.length < 5) {
        response.status(400).send("Password is too short");
      } else {
        const encryptNewPassword = await bcrypt.hash(newPassword, 10);
        const updateUserPassword = `UPDATE user SET password = '${encryptNewPassword}'
        WHERE username = '${username}';`;
        await dataBase_Path.run(updateUserPassword);
        response.status(200).send("Password updated");
      }
    } else {
      response.status(400).send("Invalid current password");
    }
  }
});

module.exports = server_instance;
