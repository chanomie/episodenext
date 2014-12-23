# Episode.Next

Keep track of your favorite shows to know what you need to watch!

Some shows are on Hulu, some are on Netflix, some are on abc.com, who knows where
else the other shows are.  A simple little webapp to let you add all of the shows
you are watching and keep track of which episodes you've already watched.  That
way you always know what you need to see.

It also integrated with Facebook OpenGraph API so that you can post that you've
watched episodes. For fun, you can search for movies and post that to your Facebook
watched history as well.

Thanks to the contributes at [http://thetvdb.com](TheTVDB.com) for all their hard work
keeping episode information up to date.

It's deployed on Google App Engine here: 
[https://thewirewatcher.appspot.com](https://thewirewatcher.appspot.com)

# Development Notes

## Build Commands
    mvn verify - verify the build
    mvn appengine:devserver - run the dev server
    mvn eclipse:eclipse - create proper eclipse profile if you've added libraries
    mvn appengine:update - upload the latest build to Google App Engine

## 3rd Party API Keys

The application connects through both [http://thetvdb.com](TheTVDB.com) and 
[https://www.themoviedb.org](themoviedb.org) to get back information on television shows
and movies.

For this to work you need your own APIs keys (both free) which are expected to be set 
into environment variables:
 * thetvdbapikey=...
 * themoviedbkey=...

## Basically CURLs to test APIs
curl http://thetvdb.com/api/${thetvdbapikey}/series/205281/all/en.xml

## API Testing:
    curl -A "facebookexternalhit/1.1" https://localhost:8080/showdetails/73730/1/1
    curl -b dev_appserver_login=test@example.com:false:18580476422013912411 http://localhost:8080/api/v1/data/series
    curl -b dev_appserver_login=test@example.com:false:18580476422013912411 http://localhost:8080/api/v1/data/watched
    curl -d seriesId=205281 -b dev_appserver_login=test@example.com:false:18580476422013912411 http://localhost:8080/api/v1/data/series
    curl -X DELETE -b dev_appserver_login=test@example.com:false:18580476422013912411 http://localhost:8080/api/v1/data/series/205281


    export JAVA_HOME=`/usr/libexec/java_home -v 1.7`



