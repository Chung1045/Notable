const path = require('path');
const {v4: uuidv4} = require('uuid');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const session = require('cookie-session');
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

//Fake database part
// function readJsonFileSync(filepath, encoding) {
//
//     if (typeof (encoding) == 'undefined') {
//         encoding = 'utf8';
//     }
//     var file = fs.readFileSync(filepath, encoding);
//     return JSON.parse(file);
// }
//
// function getConfig(file) {
//
//     var filepath = __dirname + '/' + file;
//     return readJsonFileSync(filepath);
// }
//
// noteDatabase = getConfig('public/data/fakeDatabase.json');

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

                res.render('home', { allnotes });
            } catch (error) {
                console.error('Error fetching notes:', error);
                res.status(500).render('error', { error: 'Failed to fetch notes' });
            }
        });

        app.get('/login', (req, res) => {
            res.render('login');
        });

        app.post ('/login', async (req,res) => {
    
            try{
                const check = await Userschema.findOne({userEmail: req.body.email});
                if(!check){
                    res.send("user cannot find")
                }
                const passwordcheck = await bcrypt.compare(req.body.password, check.userPassword);
                if(passwordcheck){
                    const authentication = {req.body.email};
                    req.session.userId = authentication;
                    res.render("home");
                }else{
                    res.send("wrong password");
                }

            }catch{
                res.send("wrong detail");
            }
        });

        app.get('/home', (req, res) =>{
            if (!req.session.userId) {
                return res.redirect('/login'); // Redirect to login if not authenticated
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

        app.get('/signup', (req, res) => {
            res.render('signup');
        });

        // For testing purpose
        app.get('/accountInfoFlyout', (req, res) => {
            res.render('accountInfoFlyout');
        });
        console.log(Date.now());

        // Sample, have already insert
        // user.insertMany([
        //     {
        //         userUUID: '13b078f5-62f4-47c4-a85c-5c86c7ea17a2',
        //         userName: 'john_doe',
        //         userEmail: 'john.doe@example.com',
        //         userPassword: 'hashedpassword1',
        //         userAuthenticateType: 'local'
        //     },
        //     {
        //         userUUID: '7c20fef9-4d06-4370-945a-5258363e0ea7',
        //         userName: 'jane_smith',
        //         userEmail: 'jane.smith@example.com',
        //         userPassword: 'hashedpassword2',
        //         userAuthenticateType: 'local'
        //     },
        //     {
        //         userUUID: '70667a75-7ff5-46e3-ab17-a2d6edbb4acf',
        //         userName: 'alice_brown',
        //         userEmail: 'alice.brown@example.com',
        //         userPassword: 'hashedpassword3',
        //         userAuthenticateType: 'local'
        //     },
        //     {
        //         userUUID: 'e298f48f-b3b8-4053-a4db-4f5c88b6b868',
        //         userName: 'bob_jones',
        //         userEmail: 'bob.jones@example.com',
        //         userPassword: 'hashedpassword4',
        //         userAuthenticateType: 'local'
        //     },
        //     {
        //         userUUID: '910fe5fc-d95f-4427-9534-d0264b34516c',
        //         userName: 'charlie_white',
        //         userEmail: 'charlie.white@example.com',
        //         userPassword: 'hashedpassword5',
        //         userAuthenticateType: 'local'
        //     }
        // ]).then(r => {
        //     console.log('Users inserted into database\n', r);
        //
        // });

        //Already inserted
        // noteEntry.insertMany([
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'This is a short note about today\'s meeting.',
        //         noteUserUUID: '910fe5fc-d95f-4427-9534-d0264b34516c',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'Today was a productive day. We finalized the project requirements and planned out the sprint cycles.',
        //         noteUserUUID: 'e298f48f-b3b8-4053-a4db-4f5c88b6b868',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'First paragraph: Had an important client meeting today. Discussed the key deliverables and timeline.\n\nSecond paragraph: Overall, the meeting was successful, and we have a clearer understanding of the next steps.',
        //         noteUserUUID: 'e298f48f-b3b8-4053-a4db-4f5c88b6b868',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'This is a brief note summarizing the latest updates from the team.',
        //         noteUserUUID: 'e298f48f-b3b8-4053-a4db-4f5c88b6b868',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'First paragraph: The code review went smoothly, and we identified a few areas of improvement.\n\nSecond paragraph: We need to refactor some parts of the codebase for better scalability and maintainability.',
        //         noteUserUUID: '70667a75-7ff5-46e3-ab17-a2d6edbb4acf',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'Today\'s to-do list: complete documentation, review design mockups, and deploy to staging.',
        //         noteUserUUID: '70667a75-7ff5-46e3-ab17-a2d6edbb4acf',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'Had a quick team sync today. Everyone is on track with their tasks, and we\'re ready for the next sprint.',
        //         noteUserUUID: '70667a75-7ff5-46e3-ab17-a2d6edbb4acf',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'First paragraph: The testing phase went well, with only a few minor bugs reported.\n\nSecond paragraph: We are confident that the product will be ready for the final release by the end of this week.',
        //         noteUserUUID: '70667a75-7ff5-46e3-ab17-a2d6edbb4acf',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'Reminder: Don\'t forget to send the client the updated proposal by Friday.',
        //         noteUserUUID: '70667a75-7ff5-46e3-ab17-a2d6edbb4acf',
        //         noteLastModified: Date.now()
        //     },
        //     {
        //         noteUUID: uuidv4(),
        //         noteContent: 'First paragraph: The new feature implementation is progressing well. The team has completed the core functionality.\n\nSecond paragraph: Next steps involve testing and integrating it with the existing platform.',
        //         noteUserUUID: '70667a75-7ff5-46e3-ab17-a2d6edbb4acf',
        //         noteLastModified: Date.now()
        //     }
        // ]).then(r => console.log('Note entries inserted into database\n', r));


    });

