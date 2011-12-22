var mongodb = require('./node_modules/mongodb/lib/mongodb');

var server = new mongodb.Server("127.0.0.1", 27017, {});
var db = new mongodb.Db('protonet_directory_padrino_production', server, {});

db.open(function(err, db) {
  if (err) throw err;
});

exports.lookup = function(name, callback) {
  name += '.protonet.info';
  
  // Fetch the collection publications
  db.collection('publications', function(err, collection) {
    if (err) throw err;
    
    // Locate specific document by key
    collection.find({'node_name': name}, function(err, cursor) {
      if (err) throw err;
  
      cursor.nextObject(function(err, doc) {
        if (err) throw err;
              
        console.log('callback called', doc);
        callback(doc ? doc.port : null);
      });
    });
  });
}