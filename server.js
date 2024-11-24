const path = require('path');
const {v4: uuidv4} = require('uuid');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const app = express();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const backdropHelper = require('./public/javascripts/backdropHelper.js');

const mongoDBURI = process.env.MONGODB_URI;

const userSchema = require('./models/userSchema');
const noteEntrySchema = require('./models/noteEntrySchema');

const port = 6950;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/stylesheets", express.static('public/stylesheets'));
app.use("/javascripts", express.static('public/javascripts'));
app.use("/src", express.static('public/src'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

dotenv.config();

app.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true
}));

const User = mongoose.model('User', userSchema);
const noteEntry = mongoose.model('NoteEntry', noteEntrySchema);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.userUUID);
});

passport.deserializeUser(async (userUUID, done) => {
    try {
        const user = await User.findOne({ userUUID: userUUID });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:6950/auth/google/callback",
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ userEmail: profile.emails[0].value });

        if (!user) {
            // Create a new user if they don't exist
            let newUserUUID = uuidv4();
            let userName = profile.displayName;
            let userNameSuffix = 1;

            // Check if username exists and append a number if it does
            while (await User.findOne({ userName: userName })) {
                userName = `${profile.displayName}${userNameSuffix}`;
                userNameSuffix++;
            }

            user = new User({
                userUUID: newUserUUID,
                userName: userName,
                userEmail: profile.emails[0].value,
                userAuthenticateType: "google",
                googleId: profile.id
            });
            await user.save();
        } else if (!user.googleId) {
            // If user exists but doesn't have a googleId, update it
            user.googleId = profile.id;
            user.userAuthenticateType = "google";
            await user.save();
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
};

app.post('/api/updateUsername', requireAuth, async (req, res) => {
    try {
        const { newUsername } = req.body;

        // Check if the new username is already taken
        const existingUser = await User.findOne({ userName: newUsername });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Update the username
        const updatedUser = await User.findOneAndUpdate(
            { userUUID: req.user.userUUID },
            { userName: newUsername },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'Username updated successfully', newUsername });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating the username' });
    }
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        req.session.userId = req.user.userUUID;
        res.redirect('/home');
    }
);

async function startServer() {
    try {
        console.log('Starting MongoDB connection...');
        await mongoose.connect(mongoDBURI);
        console.log('Connected to MongoDB');

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } catch (err) {
        console.error('Error connecting to MongoDB! Program will now exit\n', err);
        process.exit(1);
    }
}

startServer()
    .then(() => {

        app.get('/', requireAuth, async (req, res) => {
            res.redirect('/home');
        });

        app.get('/login', (req, res) => {
            res.render('login');
        });

        app.post('/api/login', async (req, res, next) => {
            try {
                const { userEmail, userPassword } = req.body;

                const user = await User.findOne({ userEmail: userEmail });
                if (!user) {
                    return res.status(400).json({ success: false, message: "Check credentials again" });
                }

                if (user.userAuthenticateType === "google") {
                    return res.status(400).json({ success: false, message: "Please use Google Sign-In for this account" });
                }

                const isPasswordValid = await bcrypt.compare(userPassword, user.userPassword);
                if (isPasswordValid) {
                    req.login(user, (err) => {
                        if (err) {
                            return next(err);
                        }
                        req.session.userId = user.userUUID;
                        return res.status(200).json({ success: true, message: 'Login successful' });
                    });
                } else {
                    res.status(400).json({ success: false, message: 'Check credentials again' });
                }
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({
                    success: false,
                    message: 'An error occurred during login. Please try again later.'
                });
            }
        });

        app.post('/api/notes', async (req, res) => {
            try {
                let newNoteID = uuidv4();
                const newNote = new noteEntry({
                    noteUUID: newNoteID, // Generate a new UUID for the note
                    noteContent: req.body.content,
                    noteUserUUID: req.session.userId, // Assuming you are sending the user UUID
                    noteLastModified: new Date().toISOString()
                });
                await newNote.validate();
                await newNote.save();
                res.status(200).json({success: true, message: 'New note created.', noteUUID: newNoteID});
            } catch (error) {
                console.error('Error creating note:', error);
                res.status(500).json({
                    success: false,
                    message: 'An error occurred while creating the note. Please try again later:\n' + error
                });
            }
        });

        app.get('/home', requireAuth, async (req, res) => {
            try {
                const userNotes = await noteEntry.find({noteUserUUID: req.session.userId})
                    .sort({noteLastModified: -1})
                    .exec();

                res.render('home', {allnotes: userNotes});
            } catch (error) {
                console.error('Error fetching notes:', error);
                res.status(500).render('error', {error: 'Failed to fetch notes'});
            }
        });

        app.get('/logout', (req, res) => {
            req.logout((err) => {
                if (err) {
                    return res.send("Error while logout");
                }
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Session destruction error:', err);
                    }
                    res.redirect('/login');
                });
            });
        });

        app.get('/signup', (req, res) => {
            res.render('signup');
        });

        app.post('/api/register', async (req, res) => {
            const {userName, userEmail, userPassword} = req.body;

            if (!userName || !userEmail || !userPassword) {
                return res.status(400).json({message: 'Please input all fields'});
            }

            try {
                // Check if user already exists
                const userExists = await User.findOne({$or: [{userName: userName}, {userEmail: userEmail}]});
                if (userExists) {
                    return res.status(400).json({message: 'Username or email already in use'});
                }

                // Hash the password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(userPassword, saltRounds);
                let newUserUUID = uuidv4();

                const newUser = new User({
                    userUUID: newUserUUID,
                    userName: userName,
                    userEmail: userEmail,
                    userPassword: hashedPassword,
                    userAuthenticateType: "local"
                });

                await newUser.validate();
                await newUser.save();
                req.session.userId = newUserUUID;
                return res.status(200).json({message: 'User registered successfully'});
            } catch (error) {
                console.error('Error saving new user data:', error);
                return res.status(500).json({message: 'Error registering new user'});
            }
        });

        app.post('/api/fetchUserInfo', async (req, res) => {
            // Check if user is authenticated
            if (!req.session.userId) {
                return res.status(401).json({error: 'User not authenticated'});
            }

            try {
                const user = await User.findOne({userUUID: req.session.userId});

                if (!user) {
                    return res.status(404).json({error: 'User not found'});
                }

                // Return user info
                res.json({
                    success: true,
                    userName: user.userName,
                    userEmail: user.userEmail
                });
            } catch (error) {
                console.error('Error fetching user info:', error);
                res.status(500).json({error: 'Internal server error'});
            }
        });

        app.put('/api/notes/:id', async (req, res) => {
            try {
                // Find the note by UUID instead of _id
                const noteToUpdate = await noteEntry.findOne({noteUUID: req.params.id});

                if (!noteToUpdate) {
                    return res.status(404).json({error: 'Note not found'});
                }

                // Check if the user is authorized to update this note
                if (noteToUpdate.noteUserUUID !== req.session.userId) {
                    return res.status(401).json({error: 'Note update unauthorized'});
                }

                // Update the note
                const updatedNote = await noteEntry.findOneAndUpdate(
                    {noteUUID: req.params.id},
                    {
                        $set: {
                            noteContent: req.body.content,
                            noteLastModified: new Date().toISOString()
                        }
                    },
                    {new: true}
                );

                res.json({
                    success: true,
                    message: 'Note updated successfully',
                    note: updatedNote
                });
            } catch (error) {
                console.error('Error occurred while updating the note:', error);
                res.status(500).json({
                    success: false,
                    error: 'Update of the note was unsuccessful',
                    message: error.message
                });
            }
        });

        app.delete('/api/notes/:id', async (req, res) => {
            try {
                // Find the note by UUID instead of _id
                const noteToBeDeleted = await noteEntry.findOne({noteUUID: req.params.id});

                // Check if the note exists
                if (!noteToBeDeleted) {
                    return res.status(404).json({error: 'Note not found'});
                }

                // Check if the user is authorized to delete this note
                if (noteToBeDeleted.noteUserUUID !== req.session.userId) {
                    return res.status(401).json({error: 'Note deletion unauthorized'});
                }

                // If we've passed both checks, proceed with deletion
                const deletedNote = await noteEntry.findOneAndDelete({noteUUID: req.params.id});

                // Send back the deleted note as confirmation
                res.json({
                    message: 'Note successfully deleted',
                    deletedNote: deletedNote
                });

            } catch (error) {
                console.error('Error occurred while deleting the note:', error);
                res.status(500).json({error: 'Deletion of the note was unsuccessful'});
            }
        });

        app.post('/api/searchNotes', async (req, res) => {
            try {
                const keyword = req.body.keyword;
                const userId = req.session.userId;

                if (!userId) {
                    return res.status(401).json({success: false, message: 'User not authenticated'});
                }

                let notes;
                if (keyword === '' || keyword === undefined || keyword === null) {
                    // Return all user notes
                    notes = await noteEntry.find({noteUserUUID: userId}).sort({updatedAt: -1});
                } else {
                    // Return all user notes that contain the keyword
                    notes = await noteEntry.find({
                        noteUserUUID: userId,
                        noteContent: {$regex: keyword, $options: 'i'}
                    }).sort({updatedAt: -1});
                }

                res.json({success: true, notes: notes});
            } catch (error) {
                console.error('Error searching notes:', error);
                res.status(500).json({
                    success: false,
                    message: 'An error occurred while searching notes',
                    error: error.message
                });
            }
        });

        app.post("/api/getBackDrop", async (req, res) => {
            try {
                const backgroundURL = await backdropHelper.fetchUnsplashBackground();
                res.json({ success: true, backgroundURL });
            } catch (e) {
                console.error("Error fetching backdrop:", e);
                res.status(500).json({ success: false, error: "Internal server error" });
            }
        });

    });

