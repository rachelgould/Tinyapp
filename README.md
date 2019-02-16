# TinyApp Project: A Link-Themed URL Shortener

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["Homepage when a user is not logged in"](/docs/urls-not-logged-in.png)
!["Homepage when a user is logged in, with many shortened URLs"](/docs/urls-list.png)
!["Users can edit their shortened URLs, and view stats on unique and total visitors"](/docs/view-url.png)
!["If a user tries to perform certain actions without being logged in, they will be redirected to the login page with a warning"](/docs/login-page.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override
- time-stamp

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

# Functional Requirements

## User Stories
As an avid twitter poster, I want to be able to shorten links so that I can fit more non-link text in my tweets.

As a twitter reader, I want to be able to visit sites via shortened links, so that I can read interesting content.

(Stretch) As an avid twitter poster, I want to be able to see how many times my subscribers visit my links so that I can learn what content they like.