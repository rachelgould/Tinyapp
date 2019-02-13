const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser"); // Converts the request from a Buffer to something we can read
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
  let randomString = "";
  const allowableCharacters = ('abcdefghijklmnopqrstuvwxyz' + 'abcdefghijklmnopqrstuvwxyz'.toUpperCase() + '1234567890').split('');
  for (let i = 0; i < 6; i++) {
    let index = Math.floor(Math.random() * 62);
    randomString += allowableCharacters[index];
  }
  return randomString;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// This needs to be above the route for /urls/:shortURL because it takes precedence, and otherwise Express will think new is a route parameter
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase }; //This HAS to be in the form of an object, even if there's only 1 key
  res.render("urls_index", templateVars); //urls_index is the .ejs file that's being passed the templateVars object. EJS automatically looks in a views folder, and appends the .ejs extension to urls_index
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  urlDatabase[generateRandomString()] = [req.body.longURL]; // Adds it to our url database
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});