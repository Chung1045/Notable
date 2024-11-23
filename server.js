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

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
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

startServer()
    .then(() => {
        const User = mongoose.model('User', userSchema);
        const noteEntry = mongoose.model('NoteEntry', noteEntrySchema);
        console.log("The generated random UUID is " + uuidv4());

        app.get('/', async (req, res) => {
            try {
                const allnotes = await noteEntry.find().exec();

                res.render('home', {allnotes});
            } catch (error) {
                console.error('Error fetching notes:', error);
                res.status(500).render('error', {error: 'Failed to fetch notes'});
            }
        });

        app.get('/login', (req, res) => {
            res.render('login');
        });

        app.post('/login', async (req, res) => {
            try {
                const { email, password } = req.body;
                const user = await User.findOne({ userEmail: email });
                if (!user) {
                    return res.status(400).json({ message: 'User not found' });
                }
                const isPasswordValid = await bcrypt.compare(password, user.userPassword);
                if (isPasswordValid) {
                    req.session.userId = user.userUUID;
                    res.json({ message: 'Login successful' });
                } else {
                    res.status(400).json({ message: 'Invalid password' });
                }
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ message: 'An error occurred during login' });
            }
        });

        app.get('/home', async (req, res) => {
            if (!req.session.userId) {
                return res.redirect('/login'); // Redirect to login if not authenticated
            }
            try {
                const allnotes = await noteEntry.find().exec();

                res.render('home', {allnotes});
            } catch (error) {
                console.error('Error fetching notes:', error);
                res.status(500).render('error', {error: 'Failed to fetch notes'});
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

        app.post('/register', async (req, res) => {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ message: 'Please input all fields' });
            }

            try {
                // Check if user already exists
                const existingUser = await User.findOne({ userEmail: email });
                if (existingUser) {
                    return res.status(400).json({ message: 'Email already in use' });
                }

                // Hash the password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                const newUser = new User({
                    userUUID: uuidv4(),
                    userName: name,
                    userEmail: email,
                    userPassword: hashedPassword,
                    userAuthenticateType: "local"
                });

                await newUser.validate();
                await newUser.save();
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

