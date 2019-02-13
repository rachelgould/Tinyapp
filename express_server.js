var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase }; //This HAS to be in the form of an object, even if there's only 1 key
  res.render("urls_index", templateVars); //urls_index is the .ejs file that's being passed the templateVars object. EJS automatically looks in a views folder, and appends the .ejs extension to urls_index
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});