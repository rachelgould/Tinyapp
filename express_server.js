const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
const bodyParser = require("body-parser"); // Converts the request from a Buffer to something we can read
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

/////////////////////////////////////////////////////////////
// HELPER FUNCTIONS -----------------------------------------
/////////////////////////////////////////////////////////////

// Used to generate random string for User IDs and short URLs
function generateRandomString() {
  let randomString = "";
  const allowableCharacters = ('abcdefghijklmnopqrstuvwxyz' + 'abcdefghijklmnopqrstuvwxyz'.toUpperCase() + '1234567890').split('');
  for (let i = 0; i < 6; i++) {
    // Retrieve a random character from the 62-element array of allowable characters
    let index = Math.floor(Math.random() * 62);
    randomString += allowableCharacters[index];
  }
  // make it generate a new one if that's already used!
  if (checkIdExists(randomString)) {
    generateRandomString();
  }
  return randomString;
}

// Adds user info to users database
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

// Checks if a given ID is already in the users/URLs databases
function checkIdExists(userId) {
  if (userId in usersDatabase) {
    return true;
  } else if (userId in urlDatabase) {
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

// Returns only the URLs that this user has created
function urlsForUser(id) {
  let userUrls = { };
  for (shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl]['userId'] === id) {
      userUrls[shortUrl] = {...urlDatabase[shortUrl]};
    }
  }
  return userUrls;
}

/////////////////////////////////////////////////////////////
// DATABASES ------------------------------------------------
/////////////////////////////////////////////////////////////

// Database of URLs
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "007" },
  "sgq3y6": { longURL: "http://www.google.com", userId: "007" }
};

// Database of user accounts
const usersDatabase = {
  "007": {
    id: "007",
    email: "bond@jamesbond.com",
    password: "spy"
  }
}

/////////////////////////////////////////////////////////////
// GET REQUESTS ---------------------------------------------
/////////////////////////////////////////////////////////////

// Redirects from the short link to the long URL associated with :shortURL in the database
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

// Page where user can create a new shortlink
// This needs to be above the route for /urls/:shortURL because it takes precedence, and otherwise Express will think new is a route parameter
app.get("/urls/new", (req, res) => {
  if (req.cookies.userId) {
    let templateVars = { user: getUserById(req.cookies.userId) };
    res.render("urls_new", templateVars);
  } else {
    let templateVars = { user: getUserById(req.cookies.userId), restrictedAction: true };
    res.render("login", templateVars)
  }
});

// Shows the edit page for :shortURL
app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies.userId) {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user: getUserById(req.cookies.userId) };
    res.render("urls_show", templateVars);
  } else {
    let templateVars = { user: getUserById(req.cookies.userId), restrictedAction: true };
    res.render("login", templateVars)
  }
});

// Shows all the URLs in the database
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUser(req.cookies.userId), user: getUserById(req.cookies.userId) };
  res.render("urls_index", templateVars);
});

// Shows registration page
app.get("/register", (req, res) => {
  let templateVars = { user: getUserById(req.cookies.userId) };
  res.render("register", templateVars);
});

// Shows login page
app.get("/login", (req, res) => {
  let templateVars = { user: getUserById(req.cookies.userId), restrictedAction: false };
  res.render("login", templateVars);
})

// Redirect '/' to the urls list
app.get("/", (req, res) => {
  res.redirect('/urls');
});

/////////////////////////////////////////////////////////////
// POST REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// Delete :shortURL entry from database
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.userId) {
    delete urlDatabase[req.params.shortURL]; // Delete removes the specified shortURL property from the urlDatabase
    res.redirect("/urls"); // After updating, redirects back to the main URLs list
  } else {
    let templateVars = { user: getUserById(req.cookies.userId), restrictedAction: true };
    res.render("login", templateVars);
  }
});

// Updates the long URL associated with :shortUrl
app.post("/urls/:shortURL/", (req, res) => {
  if (req.cookies.userId) {
    urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL; // Updates the specified URL from the urlDatabase
    res.redirect("/urls"); // After updating, redirects back to the main URLs list
  } else {
    let templateVars = { user: getUserById(req.cookies.userId), restrictedAction: true };
    res.render("login", templateVars);
  }
});

// Adds the long URL to the database with an associated random short URL
app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { longURL: [req.body.longURL], userId: req.cookies.userId }; // Adds it to our url database
  res.redirect(`/urls/${newShortURL}`); // Redirect to the page for the newly-generated short URL
});

// Logs out user and clears cookie
app.post("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect('/urls');
});

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
  } else { // This will be triggered if the password is invalid
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

/////////////////////////////////////////////////////////////
// SERVER FUNCTION ------------------------------------------
/////////////////////////////////////////////////////////////

// Boot up the server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
