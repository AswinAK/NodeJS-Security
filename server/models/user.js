const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs')

var UserSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: '{VALUE} is not a valid email'
      }
    },
    name:{
      type: String,
      required: false,
      minlength:3
    },
    location:{
      type: String,
      required: false,
      minlength:3
    },
    password: {
      type: String,
      require: true,
      minlength: 6
    },
    tokens: [{
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }]
});

UserSchema.methods.generateAuthToken = function(){
  var user = this;
  var access = 'auth';
  var token = jwt.sign({
    _id: user._id.toHexString(),
    access
  },'secretABC').toString();
  user.tokens = user.tokens.concat([{access,token}]);
  return user.save().then(()=>{
    return token;
  });
}

UserSchema.methods.toJSON = function(){
  var user = this;
  return _.pick(user,['_id','email'])
}

UserSchema.methods.removeToken = function(token){
  var user = this;
  return user.update({
    $pull: {tokens:{token}}}
  );
}


UserSchema.statics.findByToken = function(token){
    var User = this;
    var decoded;

    try{
      decoded = jwt.verify(token,'secretABC');
    }catch(e){
      console.log('JWT verification failed!');
      return Promise.reject();
    }

    return User.findOne({
      '_id': decoded._id,
      'tokens.access': 'auth',
      'tokens.token': token
    });
}

UserSchema.statics.findByCredentials = function(email,password){
  var User = this;

  return User.findOne({email}).then((user)=>{
      if(!user){
        return Promise.reject();
      }

      return new Promise((result,reject)=>{
        bcrypt.compare(password, user.password, (err, res) => {
          if(res){
            result(user);
          }else{
            console.log('not able to get user with given credentials');
            reject();
          }
        });
      })
  })
}


UserSchema.pre('save',function(next){
  var user = this;
  console.log('here...');
  if(user.isModified('password')){
    console.log('here 2...');
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        console.log('user is ',user.password);
        next();
      });
    });
  }else{
    next();
  }
});

var User = mongoose.model('User', UserSchema );

module.exports = {User}
