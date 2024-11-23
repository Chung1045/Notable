const path = require('path');
const {v4: uuidv4} = require('uuid');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const app = express();

const mongoDBURI = "mongodb+srv://server:wCBOhlZO9qwx5fGq@notable.4ntdo.mongodb.net/?retryWrites=true&w=majority&appName=Notable";

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


app.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true
}));

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

const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

startServer()
    .then(() => {
        const User = mongoose.model('User', userSchema);
        const noteEntry = mongoose.model('NoteEntry', noteEntrySchema);

        app.get('/', requireAuth, async (req, res) => {
            res.redirect('/home');
        });

        app.get('/login', (req, res) => {
            res.render('login');
        });

        app.post('/api/login', async (req, res) => {
            try {
                const { userEmail, userPassword } = req.body;

                // Log the received data (remove in production)
                console.log('Login attempt:', { userEmail, userPassword: '****' });

                const user = await User.findOne({ userEmail: userEmail });
                if (!user) {
                    console.log('User not found:', userEmail);
                    return res.status(400).json({ success: false, message: "Check credentials again" });
                }

                const isPasswordValid = await bcrypt.compare(userPassword, user.userPassword);
                if (isPasswordValid) {
                    req.session.userId = user.userUUID;
                    console.log('Login successful for user:', userEmail);
                    res.status(200).json({ success: true, message: 'Login successful' });
                } else {
                    console.log('Invalid password for user:', userEmail);
                    res.status(400).json({ success: false, message: 'Check credentials again' });
                }
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ success: false, message: 'An error occurred during login. Please try again later.' });
            }
        });

        app.post('/api/notes', async (req, res) => {
            try {
                console.log('Received note creation request:', req.body);
                console.log('From user id:', req.session.userId);
                let newNoteID = uuidv4();
                const newNote = new noteEntry({
                    noteUUID: newNoteID, // Generate a new UUID for the note
                    noteContent: req.body.content,
                    noteUserUUID: req.session.userId, // Assuming you are sending the user UUID
                    noteLastModified: new Date().toISOString()
                });
                await newNote.validate();
                await newNote.save();
                res.status(200).json({ success: true, message: 'New note created.', noteUUID: newNoteID });
            } catch (error) {
                console.error('Error creating note:', error);
                res.status(500).json({ success: false, message: 'An error occurred while creating the note. Please try again later:\n' + error });
            }
        });

        app.get('/home', requireAuth, async (req, res) => {
            try {
                const userNotes = await noteEntry.find({ noteUserUUID: req.session.userId })
                    .sort({ noteLastModified: -1 })
                    .exec();

                res.render('home', { allnotes: userNotes });
            } catch (error) {
                console.error('Error fetching notes:', error);
                res.status(500).render('error', { error: 'Failed to fetch notes' });
            }
        });

        app.get('/logout', (req, res) => {
            req.session.destroy(err => {
                if (err) {
                    return res.send("Error while logout");
                }
                res.redirect('/login'); // Redirect to login after logout
            });
        });


        let users = [];

        app.get('/signup', (req, res) => {
            res.render('signup');
        });

        app.post('/api/register', async (req, res) => {
            const { userName, userEmail, userPassword } = req.body;
            console.log('Received registration data:', userName, userEmail, userPassword);

            if (!userName || !userEmail || !userPassword) {
                return res.status(400).json({ message: 'Please input all fields' });
            }

            try {
                // Check if user already exists
                const userExists = await User.findOne({ $or: [{ userName: userName }, { userEmail: userEmail }] });
                if (userExists) {
                    return res.status(400).json({ message: 'Username or email already in use' });
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
                return res.status(200).json({ message: 'User registered successfully' });
            } catch (error) {
                console.error('Error saving new user data:', error);
                return res.status(500).json({ message: 'Error registering new user' });
            }
        });

        app.post('/api/fetchUserInfo', async (req, res) => {
            // Check if user is authenticated
            if (!req.session.userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            try {
                console.log('Session userId:', req.session.userId);

                // Fetch user from database
                const user = await User.findOne({ userUUID: req.session.userId });

                console.log('Found user:', user);

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Return user info
                res.json({
                    success: true,
                    userName: user.userName,
                    userEmail: user.userEmail
                });
            } catch (error) {
                console.error('Error fetching user info:', error);
                res.status(500).json({ error: 'Internal server error' });
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
                const noteToBeDeleted = await noteEntry.findOne({ noteUUID: req.params.id });

                // Check if the note exists
                if (!noteToBeDeleted) {
                    return res.status(404).json({ error: 'Note not found' });
                }

                // Check if the user is authorized to delete this note
                if (noteToBeDeleted.noteUserUUID !== req.session.userId) {
                    return res.status(401).json({ error: 'Note deletion unauthorized' });
                }

                // If we've passed both checks, proceed with deletion
                const deletedNote = await noteEntry.findOneAndDelete({ noteUUID: req.params.id });

                // Send back the deleted note as confirmation
                res.json({
                    message: 'Note successfully deleted',
                    deletedNote: deletedNote
                });

            } catch (error) {
                console.error('Error occurred while deleting the note:', error);
                res.status(500).json({ error: 'Deletion of the note was unsuccessful' });
            }
        });

        app.post('/api/searchNotes', async (req, res) => {
            try {
                const keyword = req.body.keyword;
                const userId = req.session.userId;

                if (!userId) {
                    return res.status(401).json({ success: false, message: 'User not authenticated' });
                }

                console.log(keyword);

                let notes;
                if (keyword === '' || keyword === undefined || keyword === null) {
                    // Return all user notes
                    notes = await noteEntry.find({ noteUserUUID: userId }).sort({ updatedAt: -1 });
                } else {
                    // Return all user notes that contain the keyword
                    notes = await noteEntry.find({
                        noteUserUUID: userId,
                        noteContent: { $regex: keyword, $options: 'i' }
                    }).sort({ updatedAt: -1 });
                }

                console.log(`Found ${notes.length} notes for user ${userId} with keyword "${keyword}"`);

                res.json({ success: true, notes: notes });
            } catch (error) {
                console.error('Error searching notes:', error);
                res.status(500).json({ success: false, message: 'An error occurred while searching notes', error: error.message });
            }
        });

    });

