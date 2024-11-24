# Project files overview

### Structure

```
├── README.md
├── models
│   ├── noteEntrySchema.js
│   └── userSchema.js
├── note for authentication check
├── package-lock.json
├── package.json
├── public
│   ├── data
│   │   └── fakeDatabase.json
│   ├── javascripts
│   │   ├── accountInfoFlyoutHelper.js
│   │   ├── backdropHelper.js
│   │   ├── loginHelper.js
│   │   ├── noteHelper.js
│   │   └── signUPHelper.js
│   ├── src
│   │   └── person-circle.svg
│   └── stylesheets
│       ├── accountInfoFlyout.css
│       ├── home.css
│       ├── login.css
│       └── signup.css
├── server.js
└── views
    ├── accountInfoFlyout.ejs
    ├── home.ejs
    ├── login.ejs
    └── signup.ejs
```

*Excluding folder from “.idea”, “node_modules” and "docs" folder

### server.js

This is the place where all the server side operation and route for the client handled.

It handles the CURD of the MongoDB database for user and note and more, for instance:

User

- (POST) `/api/login` : Handle login authentication using email and password
- (POST) `/api/register` : Handle user registration using email and password
- (POST) `/api/fetchUserInfo` : Get user information
- (GET) `/logout` : Log out the user

Note

- (POST) `/api/notes` : Handle the creation of user notes
- (PUT) `/api/notes/:id` : Handle the update of the user notes
- (DELETE) `/api/notes/:id` : Handle deletion of the user notes
- (POST) `/api/searchNotes` : Handle note Searching

Settings

- (PUT) `/api/updatePassword` : Update password (Google OAuth user not applicable)
- (PUT) `/api/updateEmail` : Update email (Google OAuth user not applicable)
- (PUT) `/api/updateUsername` : Update username

Google OAuth

- (GET) `/auth/google` : Redirect to Google OAuth
- (GET) `/auth/google/callback` : Callback function to redirect user to another page

Unsplash

- (POST) `/api/getBackDrop` : Fetch backdrop from Unsplash using API Access Key, logic handled in `javascripts/backdropHelper.js`

### package.json

Dependencies used:

```
"dependencies": {
    "bcrypt": "^5.1.1",
    "cookie-session": "^2.1.0",
    "dotenv": "^16.4.5",
    "ejs": "^3.1.10",
    "express": "^4.21.1",
    "express-session": "^1.18.1",
    "mongoose": "^8.8.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "uuid": "^11.0.2"
  }
```

### public

```
.
├── data
│   └── fakeDatabase.json
├── javascripts
│   ├── accountInfoFlyoutHelper.js
│   ├── backdropHelper.js
│   ├── loginHelper.js
│   ├── noteHelper.js
│   └── signUPHelper.js
├── src
│   └── person-circle.svg
└── stylesheets
    ├── accountInfoFlyout.css
    ├── home.css
    ├── login.css
    └── signup.css

```

| folder      | usage                                                                                   |
|-------------|-----------------------------------------------------------------------------------------|
| data        | Fake-database for testing, now depreciated                                              |
| javascripts | Location where the Helper JavaScripts are stored and use in the ejs template and server |
| src         | Image for displaying the user avatar in the home page of the application                |
| stylesheets | Styling for different pages                                                             |

### views

```
.
├── accountInfoFlyout.ejs
├── home.ejs
├── login.ejs
└── signup.ej
```

Place where all the page structure is defined

### models

```
.
├── noteEntrySchema.js
└── userSchema.js
```

Place where the blueprint of the data-structure of the MongoDB Database backend structure are defined