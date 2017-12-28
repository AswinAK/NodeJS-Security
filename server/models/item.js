var mongoose = require('mongoose');

var Item = mongoose.model('Item', {
  name: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  price:{

  },
  acquired: {
    type: Boolean,
    default: false
  },
  acquiredOn: {
    type: Number,
    default: null
  },
  dreamer:{
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = {Item};
