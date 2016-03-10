var rss_lookup = require('./index');

var url = 'http://www.html5rocks.com/en/tutorials/es6/promises/';

rss_lookup(url)
.then(function(feeds) {
  console.log(feeds); // "Stuff worked!"
}, function(err) {
  console.log(err); // Error: "It broke"
});
