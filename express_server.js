const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
const bodyParser = require("body-parser"); // Converts the request from a Buffer to something we can read
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

function generateRandomString() {
  let randomString = "";
  const allowableCharacters = ('abcdefghijklmnopqrstuvwxyz' + 'abcdefghijklmnopqrstuvwxyz'.toUpperCase() + '1234567890').split('');
  for (let i = 0; i < 6; i++) {
    // Retrieve a random character from the 62-element array of allowable characters
    let index = Math.floor(Math.random() * 62);
    randomString += allowableCharacters[index];
  } // make it generate a new one if that's already used!
  if (checkIdExists(randomString)) {
    generateRandomString();
  }
  return randomString;
}

function addNewUser(userEmail, userPassword) {
  let userID = generateRandomString();
  usersDatabase[userID] = {
    id: userID,
    email: userEmail,
    password: userPassword
  };
  return userID;
}

// Checks if a given email is already in the users database
function checkEmailExists(userEmail) {
  for (id in usersDatabase) {
    if (usersDatabase[id]['email'] === userEmail) {
      return true;
    }
  }
  return false;
}

// Checks if a given ID is already in the users database
function checkIdExists(userId) {
  if (userId in usersDatabase) {
    return true;
  }
  return false;
}

// Get user object by user ID
function getUserById(userId) {
  return usersDatabase[userId];
}

// Get user object by email
function getUserByEmail(userEmail) {
  let userId = "";
  for (id in usersDatabase) {
    if (usersDatabase[id]['email'] === userEmail) {
      return usersDatabase[id];
    }
  }
}

// Database of URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Database of user accounts
const usersDatabase = {
  "007": {
    id: "007",
    email: "bond@jamesbond.com",
    password: "spy"
  }
}

// Get raw JSON of the database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Delete :shortURL entry from database
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]; // Delete removes the specified shortURL property from the urlDatabase
  res.redirect("/urls"); // After updating, redirects back to the main URLs list
});

// Updates the long URL associated with :shortUrl
app.post("/urls/:shortURL/", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL; // Updates the specified URL from the urlDatabase
  res.redirect("/urls"); // After updating, redirects back to the main URLs list
});

// Redirects from the short link to the long URL associated with :shortURL in the database
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// This needs to be above the route for /urls/:shortURL because it takes precedence, and otherwise Express will think new is a route parameter
app.get("/urls/new", (req, res) => {
  let templateVars = { user: getUserById(req.cookies.userId) };
  res.render("urls_new", templateVars);
});

// Shows the edit page for :shortURL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: getUserById(req.cookies.userId) };
  res.render("urls_show", templateVars);
});

// Shows all the URLs in the database
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: getUserById(req.cookies.userId) }; // This HAS to be in the form of an object, even if there's only 1 key
  res.render("urls_index", templateVars); // urls_index is the .ejs file that's being passed the templateVars object. EJS automatically looks in a views folder, and appends the .ejs extension to urls_index
});

// Adds the long URL to the database with an associated random short URL
app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = [req.body.longURL]; // Adds it to our url database
  res.redirect(`/urls/${newShortURL}`); // Redirect to the page for the newly-generated short URL
});

// Logs out user and clears cookie
app.post("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect('/urls');
});

// Shows registration page
app.get("/register", (req, res) => {
  let templateVars = { user: getUserById(req.cookies.userId) };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { user: getUserById(req.cookies.userId) };
  res.render("login", templateVars);
})

// Log in existing user
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send("Error! You need to enter values for email and password.");
  } else if (checkEmailExists(email) === false) {
    res.status(403).send("Error! Couldn't find an account with that email. Try again.");
  } else if (getUserByEmail(email)["password"] === password) {
    res.cookie("userId", getUserByEmail(email)["id"]);
    res.redirect("/urls");
  } else {
    res.status(403).send('Error! Please check your email and password and try again.');
  }
});

// Creates new user account, adds it to database and sets cookies
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send('Error! You need to enter values for email and password.');
  } else if (checkEmailExists(email)) {
    res.status(400).send('Error! This email already has an account. Try another one.');
  } else {
    let userId = addNewUser(email, password);
    // Set up user ID cookie
    res.cookie("userId", userId);
    res.redirect("/");
  }
});

app.get("/", (req, res) => {
  res.redirect('/urls');
});

// Boot up the server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});



