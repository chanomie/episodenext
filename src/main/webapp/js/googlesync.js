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
  var googlesync = {
    // 'googleSyncKeyArray',
    // 'googleArrayResult',
    // googleArrayIndex,
    //    googleWatchedEpisodesSync,
    //    googleSeriesListSync,
    //    googleLocalDirty,

    'isGoogleSyncing': false,
    'googleSyncStart': new Date(),
    'googleLastSyncTime': 0,

    setEpisodeNext: function(episodeNext) {
      var syncgoogle = this;
      
      syncgoogle.episodeNext = episodeNext;
    },

    syncGoogle: function() {
      var googlesync = this;

      if(!googlesync.isGoogleSyncing && googlesync.episodeNext.googleAuth) {
        googlesync.episodeNext.spin("syncGoogle");
        googlesync.episodeNext.trackSyncService("Google","Sync Start");
        googlesync.googleSyncStart = new Date();
        if(localStorage.getItem("lastGoogleSync") != null) {
          googlesync.googleLastSyncTime = localStorage.getItem("lastGoogleSync");
        }

        console.log("Starting Google Sync: " + googlesync.googleSyncStart.toLocaleString());
        googlesync.isGoogleSyncing = true;
        googlesync.googleWatchedEpisodesSync = googlesync.episodeNext.getWatchedEpisodes();
        googlesync.googleSeriesListSync = googlesync.episodeNext.getSeriesList();
        googlesync.googleLocalDirty = false;
        googlesync.googleArrayResult = [];
        googlesync.googleArrayIndex = 0;

        // Setup to Sync Watched Episodes From Google
        $.ajax({
          url: googlesync.episodeNext.googleRootUrl+"/data/watched?updated="+googlesync.googleLastSyncTime,
          success: function(data, status) {
            googlesync.googleArrayResult = data;
            googlesync.googleArrayIndex = 0;
            console.log("Got watched episodes from Google: " + ((new Date() - googlesync.googleSyncStart)/1000));
          },
          complete: function(jqXHR,textStatus) {
            setTimeout(googlesync.syncWatchedEpisodesFromGoogle.bind(googlesync), googlesync.episodeNext.timeoutDelay);
          },
          error: function(jqXHR,textStatus) { googlesync.episodeNext.genericError(jqXHR,textStatus); }
        });
      }
    },

    syncWatchedEpisodesFromGoogle: function() {
      var googlesync = this,
          episodeKey,
          googleUpdated;

      if(googlesync.googleArrayIndex < googlesync.googleArrayResult.length) {
        episodeKey = googlesync.googleArrayResult[googlesync.googleArrayIndex].watchedKey,
        googleUpdated = googlesync.googleArrayResult[googlesync.googleArrayIndex].updated;
        if(googleUpdated == null) {
          googleUpdated = 0;
          googlesync.googleArrayResult[googlesync.googleArrayIndex].updated = googleUpdated;
        }

        if(episodeKey !== null && !(episodeKey in googlesync.googleWatchedEpisodesSync)) {
          console.log("Added local key " + episodeKey + ": " + ((new Date() - googlesync.googleSyncStart)/1000));
          googlesync.googleWatchedEpisodesSync[episodeKey] = (new Date()).getTime();
          googlesync.googleLocalDirty = true;
        }

        googlesync.googleArrayIndex++;
        setTimeout(googlesync.syncWatchedEpisodesFromGoogle.bind(googlesync),googlesync.episodeNext.timeoutDelay);
      } else {
        console.log("All done syncing episodes from Google. " + ((new Date() - googlesync.googleSyncStart)/1000));

        if(googlesync.googleLocalDirty) {
          // Done with local sync
          console.log("Local is dirty, so recache." + ((new Date() - googlesync.googleSyncStart)/1000));
          googlesync.episodeNext.saveWatchedEpisodes(googlesync.googleWatchedEpisodesSync, false); // don't recache
          googlesync.episodeNext.saveSeriesList(googlesync.googleSeriesListSync);
          googlesync.googleLocalDirty = false;
          googlesync.episodeNext.recache();
        }

        // Setup to Sync Series Google
        googlesync.googleArrayResult = [];
        googlesync.googleArrayIndex = 0;

        // Setup to Sync Watched Episodes From Google
        $.ajax({
          url: googlesync.episodeNext.googleRootUrl+"/data/series?updated="+googlesync.googleLastSyncTime,
          success: function(data, status) {
            googlesync.googleArrayResult = data;
            googlesync.googleArrayIndex = 0;
            console.log("Got series from Google: " + ((new Date() - googlesync.googleSyncStart)/1000));
          },
          complete: function(jqXHR,textStatus) {
            setTimeout(googlesync.syncSeriesFromGoogle.bind(googlesync),googlesync.episodeNext.timeoutDelay);
          },
          error: function(jqXHR,textStatus) { googlesync.genericError(jqXHR,textStatus); }
        });
      }
    },

    syncSeriesFromGoogle: function() {
      var googlesync = this,
          seriesId,
          googleUpdated;

      if(googlesync.googleArrayIndex < googlesync.googleArrayResult.length) {
        seriesId = googlesync.googleArrayResult[googlesync.googleArrayIndex].seriesId;
        googleUpdated = googlesync.googleArrayResult[googlesync.googleArrayIndex].updated;

        if(googleUpdated == null) {
          googleUpdated = 0;
          googlesync.googleArrayResult[googlesync.googleArrayIndex].updated = googleUpdated;
        }

        if(seriesId !== null && !(seriesId in googlesync.googleSeriesListSync)) {
          googlesync.googleSeriesListSync[seriesId] = (new Date()).getTime();
          googlesync.googleLocalDirty = true;
        }

        googlesync.googleArrayIndex++;
        setTimeout(googlesync.syncSeriesFromGoogle.bind(googlesync),googlesync.episodeNext.timeoutDelay);
      } else {
        console.log("All done syncing series from Google. " + ((new Date() - googlesync.googleSyncStart)/1000));
        if(googlesync.googleLocalDirty) {
          // Done with local sync
          console.log("Local is dirty, so recache." + ((new Date() - googlesync.googleSyncStart)/1000));
          googlesync.episodeNext.saveWatchedEpisodes(googlesync.googleWatchedEpisodesSync, false); // don't recache
          googlesync.episodeNext.saveSeriesList(googlesync.googleSeriesListSync);
          googlesync.googleLocalDirty = false;
          googlesync.episodeNext.recache();
        }

        // Setup to Sync Watched Episode To Google
        googlesync.googleArrayResult = Object.keys(googlesync.googleWatchedEpisodesSync);
        googlesync.googleArrayIndex = 0;
        setTimeout(googlesync.syncWatchedEpisodesToGoogle.bind(googlesync),googlesync.episodeNext.slowTimeoutDelay);
      }
    },

    syncWatchedEpisodesToGoogle: function() {
      var googlesync = this,
          episodeKey,
          episodeValue;

      if(googlesync.googleArrayIndex < googlesync.googleArrayResult.length) {
        episodeKey = googlesync.googleArrayResult[googlesync.googleArrayIndex++],
        episodeValue = googlesync.googleWatchedEpisodesSync[episodeKey];

        googlesync.googleArrayIndex++;

        if(episodeValue >= googlesync.googleLastSyncTime) {
          $.ajax({
            url: googlesync.episodeNext.googleRootUrl+"/data/watched",
            type: "POST",
            data: { "watchedKey": episodeKey, "updated": (new Date()).getTime() },
            error: function(jqXHR,textStatus) { googlesync.episodeNext.genericError(jqXHR,textStatus); },
            complete: function(jqXHR,textStatus) {
              setTimeout(googlesync.syncWatchedEpisodesToGoogle.bind(googlesync),googlesync.episodeNext.timeoutDelay);
            }
          });
        } else {
          setTimeout(googlesync.syncWatchedEpisodesToGoogle.bind(googlesync),googlesync.episodeNext.timeoutDelay);
        }
      } else {
        console.log("All done syncing episodes to Google. " + ((new Date() - googlesync.googleSyncStart)/1000));

        // Set to Sync Series to Google
        googlesync.googleArrayResult = Object.keys(googlesync.googleSeriesListSync);
        googlesync.googleArrayIndex = 0;
        setTimeout(googlesync.syncSeriesToGoogle.bind(googlesync),googlesync.episodeNext.slowTimeoutDelay);
      }
    },

    syncSeriesToGoogle: function() {
      var googlesync = this,
          seriesKey,
          seriesValue;

      if(googlesync.googleArrayIndex < googlesync.googleArrayResult.length) {
        seriesKey = googlesync.googleArrayResult[googlesync.googleArrayIndex++],
        seriesValue = googlesync.googleSeriesListSync[seriesKey];

        if(seriesValue == null) {
          seriesValue = 0;
          googlesync.googleSeriesListSync[seriesKey] = seriesValue;
          googlesync.googleLocalDirty = true;
        }

        if(seriesValue >= googlesync.googleLastSyncTime) {
          $.ajax({
            url: googlesync.episodeNext.googleRootUrl+"/data/series",
            type: "POST",
            data: { "seriesId": seriesKey, "updated": (new Date()).getTime() },
            error: function(jqXHR,textStatus) { googlesync.genericError(jqXHR,textStatus); },
            complete: function(jqXHR,textStatus) {
              setTimeout(googlesync.syncSeriesToGoogle.bind(googlesync),googlesync.episodeNext.timeoutDelay);
            }
          });
        } else {
          setTimeout(googlesync.syncSeriesToGoogle.bind(googlesync),googlesync.episodeNext.timeoutDelay);
        }
      } else {
        console.log("All done syncing series to Google. " + ((new Date() - googlesync.googleSyncStart)/1000));
        setTimeout(googlesync.syncGoogleComplete.bind(googlesync),googlesync.episodeNext.slowTimeoutDelay);
      }
    },

    syncGoogleComplete: function() {
      var googlesync = this,
          lastGoogleSync = new Date();

      localStorage.setItem("lastGoogleSync",lastGoogleSync.getTime());
      googlesync.episodeNext.updateSyncDisplay();
      googlesync.episodeNext.stopspin("syncGoogle");
      googlesync.episodeNext.checkPopupFloaters();
      googlesync.episodeNext.trackSyncComplete("Google","Sync Complete","Time",((new Date() - googlesync.googleSyncStart)/1000));
      googlesync.isGoogleSyncing = false;
      console.log("Google sync marked complete. " + ((new Date() - googlesync.googleSyncStart)/1000));
    },
  };

  return googlesync;
});