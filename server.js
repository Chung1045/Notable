const path = require('path');
const {v4: uuidv4} = require('uuid');
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const app = express();

const port = 6950;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/stylesheets", express.static('public/stylesheets'));
app.use("/javascripts", express.static('public/javascripts'));
app.use("/src", express.static('public/src'));
app.use(express.urlencoded({extended: true}));

function readJsonFileSync(filepath, encoding) {

    if (typeof (encoding) == 'undefined') {
        encoding = 'utf8';
    }
    var file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}

function getConfig(file) {

    var filepath = __dirname + '/' + file;
    return readJsonFileSync(filepath);
}

noteDatabase = getConfig('public/data/fakeDatabase.json');

app.get('/', (req, res) => {
    res.render('home', {noteDatabase});
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

