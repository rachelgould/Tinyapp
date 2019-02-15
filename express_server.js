const express = require("express");
const bcrypt = require('bcrypt'); // For password hashing
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const timestamp = require('time-stamp');
app.set("view engine", "ejs");
const bodyParser = require("body-parser"); // Converts the request from a Buffer to something we can read
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  httpOnly: false,
  name: 'session',
  keys: ['key1'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));

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
const urlDatabase = { };

// Database of user accounts
const usersDatabase = { };

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
  if (req.session.user_id) {
    let templateVars = { user: getUserById(req.session.user_id) };
    res.render("urls_new", templateVars);
  } else {
    let templateVars = { user: getUserById(req.session.user_id), restrictedAction: true };
    res.render("login", templateVars);
  }
});

// Shows the edit page for :shortURL
app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]['userId']) {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user: getUserById(req.session.user_id), createdOn: urlDatabase[req.params.shortURL]['createdOn'] };
    res.render("urls_show", templateVars);
  } else if (req.session.user_id) {
    res.status(405).send("<h1>Error!</h1> <p>You're not permitted to do this.<p>");
  } else {
    let templateVars = { user: getUserById(req.session.user_id), restrictedAction: true };
    res.render("login", templateVars);
  }
});

// Shows all the URLs in the database
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUser(req.session.user_id), user: getUserById(req.session.user_id) };
  res.render("urls_index", templateVars);
});

// Shows registration page
app.get("/register", (req, res) => {
  let templateVars = { user: getUserById(req.session.user_id) };
  res.render("register", templateVars);
});

// Shows login page
app.get("/login", (req, res) => {
  let templateVars = { user: getUserById(req.session.user_id), restrictedAction: false };
  res.render("login", templateVars);
});

// Redirect '/' to the urls list
app.get("/", (req, res) => {
  res.redirect('/urls');
});

/////////////////////////////////////////////////////////////
// DELETE REQUESTS ------------------------------------------
/////////////////////////////////////////////////////////////

// Delete :shortURL entry from database
app.delete("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id) {
    delete urlDatabase[req.params.shortURL]; // Delete removes the specified shortURL property from the urlDatabase
    res.redirect("/urls"); // After updating, redirects back to the main URLs list
  } else {
    let templateVars = { user: getUserById(req.session.user_id), restrictedAction: true };
    res.render("login", templateVars);
  }
});

/////////////////////////////////////////////////////////////
// PUT REQUESTS ---------------------------------------------
/////////////////////////////////////////////////////////////

// Updates the long URL associated with :shortUrl
app.put("/urls/:shortURL/", (req, res) => {
  if (req.session.user_id) {
    urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL; // Updates the specified URL from the urlDatabase
    res.redirect("/urls"); // After updating, redirects back to the main URLs list
  } else {
    let templateVars = { user: getUserById(req.session.user_id), restrictedAction: true };
    res.render("login", templateVars);
  }
});

/////////////////////////////////////////////////////////////
// POST REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// Adds the long URL to the database with an associated random short URL
app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { longURL: [req.body.longURL], userId: req.session.user_id, createdOn: timestamp('DD/MM/YYYY') }; // Adds it to our url database
  res.redirect(`/urls/${newShortURL}`); // Redirect to the page for the newly-generated short URL
});

// Logs out user and clears cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Log in existing user
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send("<h1>Error!</h1> <p>You need to enter values for email and password.<p>");
  } else if (checkEmailExists(email) === false) {
    res.status(403).send("<h1>Error!</h1> <p>Couldn't find an account with that email. Try again.</p>");
  } else if (bcrypt.compareSync(password, getUserByEmail(email)["password"])) {
    req.session.user_id = getUserByEmail(email)["id"];
    res.redirect("/urls");
  } else { // This will be triggered if the password is invalid
    res.status(403).send('<h1>Error!</h1> <p>Please check your email and password and try again.</p>');
  }
});

// Creates new user account, adds it to database and sets cookies
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, 10);
  if (email === "" || password === "") {
    res.status(400).send('<h1>Error!</h1> <p>You need to enter values for email and password.</p>');
  } else if (checkEmailExists(email)) {
    res.status(400).send('<h1>Error!</h1> <p>This email already has an account. Try another one.</p>');
  } else {
    let userId = addNewUser(email, password);
    // Set up user ID cookie
    req.session.user_id = userId;
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
