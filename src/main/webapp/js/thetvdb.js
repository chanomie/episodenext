/**
 * @preserve Copyright 2013 Jordan Reed
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *  
 *  http://code.google.com/p/thewirewatcher/
 */
define([], function() {
    var thetvdb = {
        /**
         * When running through loops of synchronization, this indicates the amount
         * of time to wait in between loops while doing high priority work.
         * @define {number}
         */
        'timeoutDelay' : 0,

        /**
         * The base URL for the get series episodes API.  This proxies the request to 
         * The TV DB APIs
         *
         * @define {string}
         * @private
         */
        'getSeriesAllDetailsUrl' : 'https://thewirewatcher.appspot.com/api/all/',
        // var getSeriesAllDetailsUrl : "http://localhost:8080/api/all/"

        /**
         * The base URL for loading banner images from the TV DB API
         * @define {string}
         * @private
         */
        'bannerUrl' : 'https://thewirewatcher.appspot.com/api/banners/',

        'isRecaching' : false,
        'seriesListRecache' : {},
        'seriesListIndex' : 0,
        'nextEpisodeCache' : {},
        'seriesListCache' : {},
        'recacheStart' : new Date(),

        isWebWorker: function() {
            if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
                return true;
            } else {
                return false;
            }
        },

        setEpisodeNext: function(episodeNext) {
          var thetvdb = this;

          thetvdb.episodeNext = episodeNext;
        },

        getSeriesList: function() {
          var thetvdb = this;

          if(thetvdb.isWebWorker()) {
            console.log("TODO: Web Worker!");
          } else {
            return thetvdb.episodeNext.getSeriesList();
          }
        },

        trackSyncService: function(serviceName, action) {
          var thetvdb = this;

          if(thetvdb.isWebWorker()) {
            console.log("TODO: Web Worker!");
          } else {
            thetvdb.episodeNext.trackSyncService(serviceName, action);
          }
        },

        trackSyncComplete: function(serviceName, action, label, value) {
            var thetvdb = this;

            if(thetvdb.isWebWorker()) {
              console.log("TODO: Web Worker!");
            } else {
              thetvdb.episodeNext.trackSyncComplete(serviceName, action, label, value);
            }
        },

        spin: function(desc) {
          var thetvdb = this;

          if(thetvdb.isWebWorker()) {
            console.log("TODO: Web Worker!");
          } else {
            thetvdb.episodeNext.spin(desc);
          }
        },

        spin : function(desc) {
          var thetvdb = this;
          if(thetvdb.isWebWorker()) {
            console.log("TODO: Web Worker!");
          } else {
            thetvdb.episodeNext.spin(desc);
          }
        },
        
        stopspin : function(desc) {
          var thetvdb = this;

          if(thetvdb.isWebWorker()) {
            console.log("TODO: Web Worker!");
          } else {
            thetvdb.episodeNext.stopspin(desc);
          }
        },

        getWatchedEpisodes: function() {
          var thetvdb = this;

          if(thetvdb.isWebWorker()) {
            console.log("TODO: Web Worker!");
          } else {
            return thetvdb.episodeNext.getWatchedEpisodes();
          }
        },
        
        buildMainScreenFromCache : function() {
            var thetvdb = this;

            if(thetvdb.isWebWorker()) {
              console.log("TODO: Web Worker!");
            } else {
              return thetvdb.episodeNext.buildMainScreenFromCache();
            }
        },

        updateSyncDisplay: function() {
          var thetvdb = this;

          if(thetvdb.isWebWorker()) {
            console.log("TODO: Web Worker!");
          } else {
            return thetvdb.episodeNext.updateSyncDisplay();
          }
        },
        
        getSeries : function(seriesId) {
        	var theTvDb = this,
        	    seriesListCacheJson = localStorage.getItem("seriesListCache");
        	
            if(seriesListCacheJson !== null) {
                seriesListCache = JSON.parse(seriesListCacheJson);
                return seriesListCache[seriesId];
            } else {
            	// TODO get series from ajax call.
            }
        },

        /**
         * Requests for recache of TheTVDB data.  This is a full sync and will
         * cycle through each series and pull back the latest unwatched episode.
         */
        recache : function() {
          var theTvDb = this;

          if(!theTvDb.isRecaching) {
            theTvDb.spin("recache"); // TODO: recache sping
            theTvDb.isRecaching = true;
            theTvDb.trackSyncService("TheTVDB","Sync Start"); // TODO: Track Recache
            theTvDb.recacheStart = new Date();
            console.log("Starting recache. " + ((new Date() - theTvDb.recacheStart)/1000));
            theTvDb.seriesListRecache = Object.keys(theTvDb.getSeriesList());
            theTvDb.nextEpisodeCache = {};
            theTvDb.seriesListCache = {};
            theTvDb.seriesListIndex = 0;

            setTimeout(theTvDb.recacheSeriesLoop.bind(theTvDb),theTvDb.timeoutDelay);
          }
        },
        
        /**
         * Requests the recaching of a single series.
         */
        recacheSingleEpisode: function(seriesId) {
        	var theTvDb = this,
        	    searchUrl = theTvDb.getSeriesAllDetailsUrl + seriesId + "?includeall=false",
        	    nextEpisodeCacheJson,
        	    nextEpisodeCache;

        	theTvDb.spin("recacheSingleEpisode");
        	
            $.ajax({
                url: searchUrl,
                async: false,
                success: function(data, status) {
                	var seriesId = $(data).find("Data Series id").text(),
                        oldestUnwatchedEpisode = undefined;
                	
                	oldestUnwatchedEpisode = theTvDb.getOldestUnwatchedEpisode(data, seriesId);
                	
                	nextEpisodeCacheJson = localStorage.getItem("nextEpisodeCache");
                	if(nextEpisodeCacheJson !== null) {
                	  nextEpisodeCache = JSON.parse(nextEpisodeCacheJson);
                      if(oldestUnwatchedEpisode !== null) {
                          nextEpisodeCache[seriesId] = oldestUnwatchedEpisode;
                      } else {
                          delete nextEpisodeCache[seriesId];
                      }
                      localStorage.setItem("nextEpisodeCache",JSON.stringify(nextEpisodeCache));
                      theTvDb.buildMainScreenFromCache();
                      theTvDb.stopspin("recacheSingleEpisode");
                	}
                	
                }
            });
        },

        /**
         * This is runs a single cycle in the recaching process.
         */
        recacheSeriesLoop : function() {
          var theTvDb = this,
              lastTheTvDbSync,
              seriesListItem,
              searchUrl;

          console.log("recacheSeriesLoop seriesListIndex=[" + theTvDb.seriesListIndex
        		  + "], seriesListRecache.length=[" + theTvDb.seriesListRecache.length + "]");
        		  		
          if(theTvDb.seriesListIndex  < theTvDb.seriesListRecache.length) {
            seriesListItem = theTvDb.seriesListRecache[theTvDb.seriesListIndex++];
            searchUrl = theTvDb.getSeriesAllDetailsUrl + seriesListItem + "?includeall=false";
            
            console.log("recacheSeriesLoop searchUrl=[" + searchUrl + "]");

            $.ajax({
              url: searchUrl,
              async: false,
              success: function(data, status) {
                var newSeries = {},
                    seriesId = $(data).find("Data Series id").text(),
                    oldestUnwatchedEpisode = undefined;

                newSeries["seriesId"] = seriesId;
                newSeries["seriesName"] = $(data).find("Data Series SeriesName").text();
                newSeries["firstAiredDate"] = $(data).find("Data Series FirstAired").text(); 
                newSeries["overview"] = $(data).find("Data Series Overview").text();
                if( newSeries["overview"].length > 200 ) {
                  newSeries["overview"] = newSeries["overview"].substr(0,200) + "...";
                }

                newSeries["bannersrc"] = theTvDb.bannerUrl + $(data).find("Data Series banner").text();
                theTvDb.seriesListCache[seriesId] = newSeries;
                
                oldestUnwatchedEpisode = theTvDb.getOldestUnwatchedEpisode(data, seriesId, newSeries);
                if(oldestUnwatchedEpisode !== null) {
                  theTvDb.nextEpisodeCache[seriesId] = oldestUnwatchedEpisode;
                }
              }
            });
            setTimeout(theTvDb.recacheSeriesLoop.bind(theTvDb),theTvDb.timeoutDelay);

          } else {
            localStorage.setItem("nextEpisodeCache",JSON.stringify(theTvDb.nextEpisodeCache));
            localStorage.setItem("seriesListCache",JSON.stringify(theTvDb.seriesListCache));
            theTvDb.buildMainScreenFromCache();

            lastTheTvDbSync = new Date();
            localStorage.setItem("lastTvDbSync",lastTheTvDbSync.getTime());
            theTvDb.updateSyncDisplay(); // TODO
            theTvDb.stopspin("recache");    
            theTvDb.trackSyncComplete("TheTVDB","Sync Complete","Time",((new Date() - theTvDb.recacheStart)/1000));
            theTvDb.isRecaching = false;
            console.log("Finished recache. " + ((new Date() - theTvDb.recacheStart)/1000));
          }
        },
        
        /**
         * Gets the oldest unwatched episode from the XML returned by the Tv DB API call.
         * @param {object} data the data returned from the API call
         * @param {string} seriesId the series identifier.
         */
        getOldestUnwatchedEpisode : function(data, seriesId, series) {
          var theTvDb = this,
              oldestUnwatchedEpisode = undefined;
          
          if(series === undefined || series === null) {
            series = theTvDb.getSeries(seriesId);
          }

          $(data).find("Data Episode").each(function(i,element) {
            var episodeId = $(element).find("id").text(),
                episodeKey = seriesId + "-" + episodeId,
                firstAired,
                firstAiredDate,
                firstAiredEpoch;

            if(!(episodeKey in theTvDb.getWatchedEpisodes())) {
              firstAired = $(element).find("FirstAired").text();
              if(firstAired !== undefined && firstAired !== "") {
                firstAiredDate = new Date(firstAired);
                firstAiredEpoch = firstAiredDate.getTime();
                if(oldestUnwatchedEpisode === undefined 
                    || oldestUnwatchedEpisode["FirstAiredEpoch"] > firstAiredEpoch) {

                  oldestUnwatchedEpisode = {};
                  oldestUnwatchedEpisode["seriesId"] = seriesId;
                  oldestUnwatchedEpisode["episodeId"] = episodeId;
                  oldestUnwatchedEpisode["FirstAired"] = firstAired;
                  oldestUnwatchedEpisode["FirstAiredEpoch"] = firstAiredDate.getTime();
                  oldestUnwatchedEpisode["seriesName"] = series["seriesName"];
                  oldestUnwatchedEpisode["EpisodeName"] = $(this).find("EpisodeName").text();
                  oldestUnwatchedEpisode["EpisodeNumber"] = $(this).find("EpisodeNumber").text();
                  oldestUnwatchedEpisode["SeasonNumber"] = $(this).find("SeasonNumber").text();
                  oldestUnwatchedEpisode["bannersrc"] = series["bannersrc"];
                  oldestUnwatchedEpisode["EpisodeImage"] = theTvDb.bannerUrl+ $(this).find("filename").text();
                  oldestUnwatchedEpisode["Overview"] = $(this).find("Overview").text();
                  if( oldestUnwatchedEpisode["Overview"].length > 200 ) {
                    oldestUnwatchedEpisode["Overview"] = oldestUnwatchedEpisode["Overview"].substr(0,200) + "...";
                  }
                }
              }
            }
          });
          return oldestUnwatchedEpisode;
        },
	};

    // self.addEventListener('message', function(e) {
    //    console.log("web worker thetvdb: " + e.data);
    // }, false);

    return thetvdb;
});
