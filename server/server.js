require('./config/config');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const ObjectID = require('mongodb').ObjectID;

var {mongoose} = require('./db/mongoose');
var {Item} = require('./models/item');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');
var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/item', authenticate,(req, res) => {
  var item = new Item({
    name: req.body.name,
    price: req.body.price,
    acquired:false,
    dreamer: req.user._id
  });

  item.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/items',authenticate, (req, res) => {
  Item.find({dreamer: req.user._id}).then((items) => {
    res.send({items});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/items/:id',authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Item.findOne({
    dreamer: req.user._id,
    _id: id
  }).then((item) => {
    if (!item) {
      return res.status(404).send();
    }

    res.send({item});
  }).catch((e) => {
    res.status(400).send();
  });
});

app.delete('/items/:id', authenticate ,(req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Item.findOneAndRemove({
    _id:id,
    dreamer: req.user._id
  }).then((item) => {
    if (!item) {
      return res.status(404).send();
    }
    res.send({item});
  }).catch((e) => {
    res.status(400).send();
  });
});

app.patch('/items/:id', authenticate,(req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['name', 'acquired','price']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.acquired) && body.acquired) {
    body.ac = acquiredAt =  Date().getTime();
  } else {
    body.acquired = false;
    body.acquiredAt = null;
  }

  Item.findByIdAndUpdate({
    _id:id,
    dreamer: req.user._id
  }, {$set: body}, {new: true}).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  })
});


app.get('/users/me',authenticate,(req,res)=>{
  res.send(req.user);
});

// POST /users
app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['name','email', 'password','location']);
  console.log('stuff picked: '+JSON.stringify(body,undefined,2))
  var user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token)=>{
     res.header('x-auth',token).send(user);
  })
  .catch((e) => {
    console.log('not able to save ',e);
    res.status(400).send(e);
  })
});

app.post('/users/login',(req,res)=>{
  var _body = _.pick(req.body,['email','password']);
  User.findByCredentials(_body.email,_body.password).then((user)=>{
    user.generateAuthToken().then((token)=>{
        res.header('x-auth',token).send(user);
    });
  }).catch(e=>{res.status(401).send()});
});

app.delete('/users/me/logout', authenticate, (req,res)=>{
  req.user.removeToken(req.token).then(()=>{
    res.status(200).send();
  },
  (err)=>{
    res.status(400).send();
  })
})

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});
