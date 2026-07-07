const mongoose = require('mongoose');
const uri = 'mongodb://sovanda:SNb6pPs52D1ow8gh@ac-z3r3tb8-shard-00-00.pfat8fm.mongodb.net:27017,ac-z3r3tb8-shard-00-01.pfat8fm.mongodb.net:27017,ac-z3r3tb8-shard-00-02.pfat8fm.mongodb.net:27017/?ssl=true&replicaSet=atlas-y6x4ca-shard-0&authSource=admin&appName=Library-System';
mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(() => { console.log('CONNECTED'); process.exit(0); })
  .catch(err => { console.error(err.message); process.exit(1); });
