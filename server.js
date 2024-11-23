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
        console.log("The generated random UUID is " + uuidv4());

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

        // For testing purpose
        app.get('/accountInfoFlyout', (req, res) => {
            res.render('accountInfoFlyout');
        });
        console.log(Date.now());

    });

