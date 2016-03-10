var request = require('request');
var cheerio = require('cheerio');
var random_ua = require('random-ua');
var parse_domains = require('parse-domains');
var urlParse = require('url');
var util = require('util');
var validUrl = require('valid-url');

/**
 * To lookup a site's RSS feed
 * @param  {string} url URL of the site to lookup
 * @return {[type]}     [description]
 */
module.exports = function lookup(url){

  return new Promise(function(resolve, reject) {

    //if invalid URL, lets end right here
    if (!validUrl.isUri(url)){
      reject( Error('Invalid URL'), null );
    }

    var feeds = [];

    if( (domainObj = parse_domains(url)) ){

      var google_lookup_url = util.format('http://ajax.googleapis.com/ajax/services/feed/lookup?v=1.0&q=%s', domainObj.dtld);

      // console.log(google_lookup_url);
      // do a thing, possibly async, then…
      var options = {
        url: google_lookup_url,
        timeout: 20000,
        headers: {
          'User-Agent': random_ua.generate()
        }
      };

      request(options, function callback(error, response, body) {
        if (!error && response.statusCode == 200) {

          //We use try catch mechanism to handle wrong commands, non JSON responses and where feed cannot be found via Google API
          try{
            var respObj = JSON.parse( response.body );

            // throw 'ssss';

            //if we have a feed url
            if( respObj.responseData.url.length > 0 ){
              feeds.push(
                  {
                    domain:domainObj.dtld,
                    feed_url: respObj.responseData.url,
                    feed_type: '?'
                  }
              );
              //resolve
              resolve(feeds);
            }
            else{
              throw 'No Feed URL';
            }

          }
          catch(e){
            //if we got here, then we couldnt pick feed so we must parse site...
            //ok let's load this site & see what is the problem
            options.url= url;

            request(options, function callback(error, response, body) {

              if (!error && response.statusCode == 200) {

                var $ = cheerio.load(response.body);
                var rssType='rss';
                var rssTypes=[{type:'rss'},{type:'atom'}];

                var extract = function() {

                  var feed = $(this).attr('href');
                  feed=urlParse.resolve( url , feed );

                  //ignore comments feeds
                  var pat=/\/comments\//ig;

                  if(!feed.match(pat)){

                    feeds.push(
                        {
                          domain:domainObj.dtld,
                          feed_url: feed,
                          feed_type: rssType
                        }
                    );

                  }
                };

                // Legit
                rssType='rss';
                $('link[type*=rss]').each(extract);
                rssType='atom';
                $('link[type*=atom]').each(extract);

                // Questionable
                rssType='rss';
                $('a:contains(RSS)').each(extract);
                rssType='atom';
                $('a[href*=feedburner]').each(extract);

                //resolve
                resolve(feeds);
              }
              else {
                reject( error || Error("Something wrong happened!"), null);
              }

            });

          }

        }
        else {
          reject( error || Error("Something wrong happened!"), null);
        }


      });

    }

  });

}
