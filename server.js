const express = require('express');
const app = express();
const port = 3000;
const redis = require('redis');
const client = redis.createClient();
const fs = require('fs');
const path = require('path');
let router = express.Router();

app.use('/static',express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

client.on('connect', () => {
    console.log('Redis Connected!');
});
client.exists('userData', (err, reply) => {
    if(reply === 0){
        fs.readFile(__dirname + '/users.json', 'utf8', (err, data) => {
            client.set('userData', JSON.stringify(JSON.parse(data).users));
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});
app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, '/form.html'));
});

router.route('/users')
.get((req, res) => {
    client.get('userData', (err, reply) => {
        res.end(reply);
    });
})
.post((req, res) => {
    client.get('userData', (err, reply) => {
        var newid = 0;
        var dataArray = JSON.parse(reply);
        var maxid = Math.max.apply(Math, dataArray.map(o => o.id));
        newid = maxid + 1;
        var name = req.body.name;
        if(name == ''){
            res.status(500).send('<h2>validation error</h2>');
        }else{
            var password = req.body.password;
            var profession = req.body.profession;
            var newUser = {
                'id' : newid,
                'name' : name,
                'password' : password,
                'profession' : profession
            };
            dataArray.push(newUser);
            client.set('userData', JSON.stringify(dataArray));
            res.status(200).send('<h2>success</h2>');
        }
     });
    
});

app.use(router);


app.listen(port, () => {
    console.log('Server listening at http://localhost:%s.', port);
});
