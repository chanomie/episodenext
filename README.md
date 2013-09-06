# REST APIs

## GET /showdetails/{seriesId}
### Accept-Encoding: text/html

If the request comes from Facebook (User-Agent: facebookexternalhit) it
will return the OpenGraph values of the page.  If the request comes from
any other web browser it will issue a redirect to TheTVDB.com page
for the show, season or episode 

## GET /showdetails/{seriesId}
### Accept-Encoding: application/json

Return information about the series as JSON.
  {
    "id": "{seriesId}",
    "name": "seriesName",
    "description": "description",
    "seasons": {"1","2","3","4"}
  }


## PUT /showdetails/{seriesId}
### Accept-Encoding: application/json

Start tracking this as a show you are watching.

## DELETE /showdetails/{seriesId}
### Accept-Encoding: application/json

Stop tracking this as a show you are watching.

## GET /showdetails/{seriesId}/{seasonNumber}/{episodeNumber}
### Accept-Encoding: text/html

If the request comes from Facebook (User-Agent: facebookexternalhit) it
will return the OpenGraph values of the page.  If the request comes from
any other web browser it will issue a redirect to TheTVDB.com page
for the show, season or episode  

## PUT /showdetails/{seriesId}
### Accept-Encoding: application/json

Mark the episode as watched.

## DELETE /showdetails/{seriesId}
### Accept-Encoding: application/json

Mark the episode as not watched.

## GET /shows/search?title={showname}
### Accept-Encoding: application/json

{
  {
    "id": "{seriesId}",
    "name": "seriesName",
    "description": "description",
    "seasons": {"1","2","3","4"}
  },
  {
    "id": "{seriesId2}",
    "name": "seriesName2",
    "description": "description2",
    "seasons": {"2","3","4"}
  }
}

## GET /shows/unwatched
### Accept-Encoding: application/json
{
  {
    "id": "{seriesId}",
    "seriesUrl": "/showdetails/{seriesId}",
    "name": "seriesName",
    "description": "description",
    "unwatched": {
      {"season": "1",
       "episode": "1",
       "episodeUrl": "/showdetails/{seriesId}/{seasonNumber}/{episodeNumber}",
       "description": "description"
      },
      {"season": "1",
       "episode": "2",
       "episodeUrl": "/showdetails/{seriesId}/{seasonNumber}/{episodeNumber}",
       "description": "description"
      }      
    }
  },
  {
    "id": "{seriesId2}",
    "name": "seriesName2",
    "description": "description2",
    "seasons": {"2","3","4"}
  }
}

curl http://thetvdb.com/api/${thetvdbapikey}/series/205281/all/en.xml
curl -A "facebookexternalhit/1.1" https://thewirewatcher.appspot.com/showdetails/73730/1/1

## API Testing:
curl -b dev_appserver_login=test@example.com:false:18580476422013912411 http://localhost:8080/api/v1/data/series
curl -b dev_appserver_login=test@example.com:false:18580476422013912411 http://localhost:8080/api/v1/data/watched
curl -d seriesId=205281 -b dev_appserver_login=test@example.com:false:18580476422013912411 http://localhost:8080/api/v1/data/series
curl -X DELETE -b dev_appserver_login=test@example.com:false:18580476422013912411 http://localhost:8080/api/v1/data/series/205281


export JAVA_HOME=`/usr/libexec/java_home -v 1.7`
mvn verify - verify the build
mvn appengine:devserver - run the dev server
mvn eclipse:eclipse
mvn appengine:update

* Need to Create a 404 Page



