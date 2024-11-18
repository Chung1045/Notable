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
        const user = mongoose.model('User', userSchema);
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
                const check = await Userschema.findOne({userEmail: req.body.email});
                if (!check) {
                    res.send("user cannot find")
                }
                const passwordcheck = await bcrypt.compare(req.body.password, check.userPassword);
                if (passwordcheck) {
                    req.session.userId = user._id;
                    res.render("home");
                } else {
                    res.send("wrong password");
                }

            } catch {
                res.send("wrong detail");
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

        app.post('/register', (req, res) => {
            const userName = req.body.name;
            const userEmail = req.body.email;
            const userPassword = req.body.Password;

            const {name, email, password} = req.body;
            if (!name || !email || !password) {
                // use one res.status statement to send back error to prevent this error "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client"
                return res.status(400).json({message: 'Please input all field'});
            }

            const newUser = {
                name,
                email,
                password
            };

            User.insertMany(userData, (err, savedUsers) => {
                if (err) {
                    console.error('Error saving users:', err);
                    res.status(500).send('Error saving users');
                } else {
                    console.log('Users saved successfully:', savedUsers);
                    res.status(200).send('Users saved successfully');
                }
            });
        });

        // For testing purpose
        app.get('/accountInfoFlyout', (req, res) => {
            res.render('accountInfoFlyout');
        });
        console.log(Date.now());

    });

