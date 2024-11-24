# Notable


A straightforward, self-hostable note-taking application.

Developed using HTML / CSS / Javascript / Node.js

This project was undertaken as a group assignment for the Server Side and Cloud Computing course (COMP S381F / S3810SEF) at HKMU.

[🔗Try the live demo🔗](https://notable-q2ja.onrender.com)


## Requirements

- Computer with modern OS (macOS / Linux / Windows)
- Node.js installed and configured
- A web browser
- Some knowledge in command line
- git installed
- MongoDB API key
- Google OAuth API key
- Unsplash API Access key (Optional)
- High network bandwidth (If you want to host your own)
- An IDE (If you would like to make it your own)

For computers that do not have Node.js installed, you can install [here](https://nodejs.org/en)

For computers that do not have git installed, install [here](https://git-scm.com/)


## Set up

1. To set up, clone the repository to your computer using git

```
git clone https://github.com/Chung1045/Notable.git
```

2. Open the cloned folder in command line and install all required dependencies

```
npm i

// Or you can use

npm install
```

3. Open the IDE to put in your own API keys, either in a `.env`file or in the configuration settings
4. Run the application

```
npm start
```


## Features

- Create notes
- Edit notes (Auto save on interval of 5 seconds when focused, and when lost focus)
- Delete notes
- Search note
- Login
- Sign-up
- Google OAuth Login / Sign-up

## Project File Overview

[🔗See here (Link)🔗](docs/projectFileOverview.md)

## Library used

### NPM packages

- `uuid` : For generating random unique IDs for user and note
- `session` : Manage user session
- `bcrypt` : For checking and hashing password
- `mongoose` : Middle-man interface for database CURD
- `passport` : Authentication middleware for Node.js
- `passport-google-oauth20` : Google OAuth 2.0 Strategy for Passport
- `dotenv` : Loads environment variables from a `.env` file into `process.env`

### CDNs

- Google Font : Typeface for the application
- Bootstrap : User Interface Framework and Icons
- jQuery : Fast, small, feature-rich JavaScript library
- Masonry : Flexible, responsive. scalable grid system
- Unsplash : Photography API
