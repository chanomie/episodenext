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
define(['thetvdb','googlesync','jquery','jquery.spin','simplemodal','domReady!'], 
  function(thetvdb,googlesync,$) {

  return {
    /** 
     * Google Analytics account used to push actions to GA
     * @define {string} 
     * @private
     */
    'googleAnalyticsAccount' : 'UA-210230-2',

    /**
     * Defines if the Google Authenticated Session has been established.
     * Three potential values are 'unknown' 'no' 'yes'
     * @private
     */
    'googleAuth' : 'unknown',

    /**
     * The TV DB URL base for the API
     * @define {string}
     * @private
     */
    'TheTbDbUrlBase' : 'http://thetvdb.com',

    /**
     * The base URL for loading banner images from the TV DB API
     * @define {string}
     * @private
     */
    'bannerUrl' : 'https://thewirewatcher.appspot.com/api/banners/',

    /**
     * The base URL for loading movie posters from the Movie DB API.
     * @define {string}
     * @private
     */
    'posterUrl' : 'https://image.tmdb.org/t/p/w780',

    /**
     * The base URL for loading series search information.
     * @define {string}
     * @private
     */
    'getSeriesUrl' : 'https://thewirewatcher.appspot.com/api/search?searchterm=',

    /**
     * The base URL for the get series API.  This proxies the request to 
     * The TV DB APIs
     *
     * @define {string}
     * @private
     */
    'getSeriesDetailsUrl' : 'https://thewirewatcher.appspot.com/api/series/',

    /**
     * The base URL for the get movies API.  This proxies the request to 
     * The Movie DB APIs
     *
     * @define {string}
     * @private
     */
    'getMovieDetailsUrl' : 'https://thewirewatcher.appspot.com/api/movies/',

    /**
     * The base URL for the get movie API.  This proxies the request to 
     * The TV DB APIs
     *
     * @define {string}
     * @private
     */
    'getMovieDetailsUrl' : 'https://thewirewatcher.appspot.com/api/movies/',

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
     * The base URL for Syncing with the Google Cloud Backend API.
     * @define {string}
     * @private
     */
    'googleRootUrl' : 'https://thewirewatcher.appspot.com/api/v1',
    // 'googleRootUrl' : "http://localhost:8080/api/v1",

    /**
     * The base URL for the Open Graph object of shows.
     * The API is defined as:
     * facebookSeriesOgUrl/{seriesId}[/{episodeId}]
     * 
     * @define {string}
     * @private
     */
    'facebookSeriesOgUrl' : 'https://thewirewatcher.appspot.com/showdetails/',

    /**
     * The base URL for the Open Graph object of the movies
     * @define {string}
     * @private
     */
    'facebookMovieOgUrl' : 'https://thewirewatcher.appspot.com/moviedetails/',

    /**
     * Counter for spin requests.  Each request to start the spinner increments
     * this counter and each request to stop the spin decrements this counter.
     * When the counter is at zero, the spinning stops.
     * @type {number}
     */
    'spinCount' : 0,

    /**
     * When running through loops of synchronization, this indicates the amount
     * of time to wait in between loops while doing high priority work.
     * @define {number}
     */
    'timeoutDelay' : 0,

    /**
     * When running through loops of synchronization, this indicates a longer
     * wait time to use for lower priority tasks so there is more CPU for the
     * user interactions.
     * @define {number}
     */
    'slowTimeoutDelay' : 100,

    /**
     * Defines the amount of space that the title bar overlays.
     * @type {number}
     * @private
     */
    'topDistance' : 44,

    initialize : function() {
        var episodeNext = this;
        episodeNext.spin("Ready");
        // Update the display first!
        episodeNext.buildMainScreenFromCache();

        $("#addshowbutton").click(function() {
          $("#mainpage").slideUp('slow');
          $("#searchpage").slideDown('slow');
          episodeNext.trackPageView("/searchpage");
          $("#searchtext").focus();
        });

        $("#cancelsearch").click(function() {
          $("#mainpage").slideDown('slow');
          $("#searchpage").slideUp('slow');
          episodeNext.trackPageView("/index.html");
        });

        $("#canceladdshowpage").click(function() {
          $("#searchpage").slideDown('slow');  
          $("#addshowpage").slideUp('slow');
          episodeNext.trackPageView("/searchpage");
        });

        $("#settingsbutton").click(function() {
          episodeNext.updateSyncDisplay();
          $("#mainpage").slideUp('slow');
          $("#settingspage").slideDown('slow');

          episodeNext.trackPageView("/settingspage");
        });

        $("#settingsdone").click(function() {
          $("#settingspage").slideUp('slow');
          $("#mainpage").slideDown('slow');    
          episodeNext.trackPageView("/index.html");
        });

        $("#showdetailsdone").click(function() {
          $("#showdetailspage").slideUp('slow');
          $("#mainpage").slideDown('slow');    
          episodeNext.trackPageView("/index.html");
        });

        $("#showaboutthetvdb").click(function(){
          $("#settingspage").slideUp('slow');
          $("#aboutthetvdb").slideDown('slow');
          episodeNext.trackPageView("/aboutthetvdb");
        });

        $("#aboutthetvdbback").click(function(){
          $("#aboutthetvdb").slideUp('slow');
          $("#settingspage").slideDown('slow');
          episodeNext.trackPageView("/settingspage");
        });
      
        $("#allshowsseasonbar").click(function(event) {
          var element = event.currentTarget;
          if($(element).attr("data-status") == "hidden") {
        	  $(element).attr("data-status","shown");
            $("#allshowsexpander").removeClass("fa fa-chevron-circle-right");
            $("#allshowsexpander").addClass("fa fa-chevron-down");
            $("#showlist").show();
            $(document.body).animate({
              'scrollTop': $('#allshowsseasonbar').offset().top - episodeNext.topDistance
            }, 1000);       
          } else {
            $(element).attr("data-status","hidden");
            $("#allshowsexpander").removeClass("fa fa-chevron-down");
            $("#allshowsexpander").addClass("fa fa-chevron-circle-right");
            $("#showlist").hide();
          }
        });

        $("#unairedseasonbar").click(function(event) {
          var element = event.currentTarget;
          if($(element).attr("data-status") == "hidden") {
            $(element).attr("data-status","shown");
            $("#unairedseasonexpander").removeClass("fa fa-chevron-circle-right");
            $("#unairedseasonexpander").addClass("fa fa-chevron-down");
            $("#unairedShowList").show();
            $(document.body).animate({
              'scrollTop': $('#unairedseasonbar').offset().top - episodeNext.topDistance
            }, 1000);       
          } else {
            $(element).attr("data-status","hidden");
            $("#unairedseasonexpander").removeClass("fa fa-chevron-down");
            $("#unairedseasonexpander").addClass("fa fa-chevron-circle-right");
            $("#unairedShowList").hide();
          }
        });

        $("#addnewshowbutton").click(function (event) { episodeNext.addNewShow(event); });
        $("#addnewshowbuttonfacebook").click(function (event) { episodeNext.facebookAddNewShow(event); });
        $('#addshowform').submit(function (event) { episodeNext.onSearch(event); });
        $("#recache").click(function (event) { episodeNext.recache(); });
        $(".cancelmodal").click(function() {$.modal.close()});
        $("#facebookpost").click(function (event) { episodeNext.facebookPlayedEpisode(event); });
        $("#addtohome .close").click(function(event) {
          $("#addtohome").slideUp('slow');
          localStorage.setItem("hideaddto","true");
        });

        $("#googleSyncButton").click(function (event) { episodeNext.syncGoogle(event); });
        $("#thetvdbsync").click(function (event) { episodeNext.recache(); });

        $("#tvdbsync").change(function (event) { episodeNext.changeSyncFrequency(event); });
        $("#googlesync").change(function (event) { episodeNext.changeSyncFrequency(event); });

        $(".resetLocalStorage").click(function (event) { episodeNext.resetLocalStorage(event); });

        $("#downloadconfirm").click(function (event) {
          $.modal.close();
        });
        
        
        episodeNext.checkGoogleAuth();
        episodeNext.checkPopupFloaters();
        episodeNext.updateSyncDisplay();

        // Wait 5 seconds and then check
        setTimeout(episodeNext.checkAndSync.bind(episodeNext),1000);

        episodeNext.stopspin("Ready");
    },

    /**
     * Checks the Google Authentication Status by making a JSON call tot he status
     * API.
     */
    checkGoogleAuth: function() {
      var episodeNext = this;
      $.ajax({
        url: episodeNext.googleRootUrl+"/google/status?returnPath=" + encodeURIComponent(document.location),
        success: function(data, status) { episodeNext.checkGoogleAuthSuccess(data, status); },
        error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); }
      });
    },

    /**
     * Success result from the Check Google auth function.  This will update the Google
     * login screen as appropriate.
     */
    checkGoogleAuthSuccess: function(data, status) {
      var episodeNext = this;
      if(data.googleLoginStatus == "true") {
        episodeNext.trackSyncService("Google","Authorized");
        episodeNext.googleAuth = 'yes';
        $("#googlelogin").hide();
        $("#googlelogout").show();
        $("#googleLoginButton").click(function(event) {
          episodeNext.trackSyncService("Google","Login");
          window.location.replace(data.googleLoginUrl);
        });
        $("#googleloginmod").click(function(event) {
          episodeNext.trackSyncService("Google","Login");
          window.location.replace(data.googleLoginUrl);
        });
        $("#googleLogoutButton").click(function(event) {
          episodeNext.trackSyncService("Google","Logout");
          window.location.replace(data.googleLogoutUrl);
        });          
      } else {
        episodeNext.googleAuth = 'no';
        $("#googlelogin").show();
        $("#googlelogout").hide();
        $("#googleLoginButton").click(function(event) {
          episodeNext.trackSyncService("Google","Login");
          window.location.replace(data.googleLoginUrl);
        });
        $("#googleloginmod").click(function(event) {
          episodeNext.trackSyncService("Google","Login");
          window.location.replace(data.googleLoginUrl);
        });
        $("#googleLogoutButton").click(function(event) {
          episodeNext.trackSyncService("Google","Logout");
          window.location.replace(data.googleLogoutUrl);
        });
      }
    },

    /**
     * Checks if there are any series currently being tracked and
     * shows the help notes if there are not.
     */
    checkPopupFloaters: function() {
      var episodeNext = this,
          seriesMap = episodeNext.getSeriesList();
      if(seriesMap == null ||  Object.keys(seriesMap).length == 0) {
        $(".help").show();
      } else {
        $(".help").hide();
        if(localStorage.getItem("hideaddto") == null 
            && window
            && window.navigator
            && window.navigator.standalone == false) {
            
        $("#addtohome").slideDown('slow');
        episodeNext.trackPageView("/addtohome");
        }
      }
    },

    /**
     * Builds the main screen from the localstorage cache.
     */
    buildMainScreenFromCache : function() {
      var episodeNext = this,
          start = new Date(),
          seriesListCacheJson = localStorage.getItem("seriesListCache"),
          nextEpisodeCacheJson = localStorage.getItem("nextEpisodeCache"),
          now = new Date(),
          seriesListCache,
          seriesId,
          nextEpisodeCache,
          newEpisodeAirDateString,
          thisEpisodeAirDateString,
          newEpisodeAirDate,
          newEpisodeElement,
          appended;
            
      console.log("Build screen start: " + start.toLocaleString());

      episodeNext.spin("buildMainScreenFromCache");
      $("#showlist").empty();

      if(seriesListCacheJson !== null) {
        seriesListCache = JSON.parse(seriesListCacheJson);
        for(seriesId in seriesListCache) {
          $("#showlist").append(
            $("<div></div>").
              attr("id",("series-"+seriesListCache[seriesId]["seriesId"])).
              attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
              addClass("show").
              append(
                $("<div></div>").
                addClass("listbannerimage").
                append(
                  $("<img></img>").
                  addClass("showbanner").
                  attr("src",seriesListCache[seriesId]["bannersrc"]))).
              append(
                $("<div></div>").
                addClass("showtext").
                append(
                  $("<span></span>").
                  addClass("episodeshowname").
                  html(seriesListCache[seriesId]["seriesName"])
                ).
                append(
                  $("<span></span>").
                  addClass("episodeFirstAired").
                  html(seriesListCache[seriesId]["firstAiredDate"])
                ).
                append(
                  $("<div></div>").
                  addClass("episodeSummary").
                  html(seriesListCache[seriesId]["overview"])
                ).
                append(
                  $("<div><div>").
                  addClass("buttonRow").
                  append(
                    $("<i></i>").
                    addClass("deleteButton").
                    attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
                    addClass("fa fa-trash-o")).
                  append(
                    $("<i></i>").
                    addClass("infoButtonShow").
                    attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
                    addClass("fa fa-info-circle"))
              ))
          ); 
        }

        $("#unwatchedShowList").empty();
        $("#unairedShowList").empty();

        if(nextEpisodeCacheJson !== null) {
          nextEpisodeCache = JSON.parse(nextEpisodeCacheJson);
          for(seriesId in nextEpisodeCache) {
            newEpisodeAirDateString = nextEpisodeCache[seriesId]["FirstAired"];
            newEpisodeAirDate = episodeNext.parseDate(newEpisodeAirDateString);
            newEpisodeElement =
              $("<div></div>").
              attr("id",("series-"+nextEpisodeCache[seriesId]["seriesId"])).
              attr("data-seriesid",nextEpisodeCache[seriesId]["seriesId"]).
              addClass("show").
              append(
                $("<div></div>").
                addClass("listbannerimage").
                append(
                  $("<img></img>").
                  addClass("showbanner").
                  attr("alt",nextEpisodeCache[seriesId]["seriesName"]).
                  attr("src",nextEpisodeCache[seriesId]["bannersrc"]))).
              append(
                $("<div></div>").
                addClass("showtext").
                append(
                  $("<span></span>").
                  addClass("episodetitle").
                  html(nextEpisodeCache[seriesId]["EpisodeName"])
                ).
                append(
                  $("<div></div>").
                  addClass("seasonepisode").
                  html("Season " + nextEpisodeCache[seriesId]["SeasonNumber"] + ", Episode " + nextEpisodeCache[seriesId]["EpisodeNumber"])
                ).
                append(
                  $("<span></span>").
                  addClass("episodeFirstAired").
                  html(nextEpisodeCache[seriesId]["FirstAired"])
                ).
                append(
                  $("<div></div>").
                  addClass("episodeSummary").
                  html(nextEpisodeCache[seriesId]["Overview"])).
                append(
                  $("<div><div>").
                  addClass("buttonRow").
                  append(
                    $("<i></i>").
                    addClass("playedButton").
                    attr("data-seriesid",nextEpisodeCache[seriesId]["seriesId"]).
                    attr("data-episodeId",nextEpisodeCache[seriesId]["episodeId"]).
                    addClass("fa fa-play-circle")).
                  append(
                    $("<i></i>").
                    addClass("facebookButton").
                    attr("data-seriesid",nextEpisodeCache[seriesId]["seriesId"]).
                    attr("data-seasonnumber",nextEpisodeCache[seriesId]["SeasonNumber"]).
                    attr("data-episodenumber",nextEpisodeCache[seriesId]["EpisodeNumber"]).
                    attr("data-episodeId",nextEpisodeCache[seriesId]["episodeId"]).
                    addClass("fa fa-facebook-square")).
                  append(
                    $("<i></i>").
                    addClass("infoButtonShow").
                    attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
                    addClass("fa fa-info-circle")).
                  append(
                    $("<i></i>").
                    addClass("downloadButtonShow").
                    attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
                    attr("data-seriesName",nextEpisodeCache[seriesId]["seriesName"]).
                    attr("data-seasonnumber",nextEpisodeCache[seriesId]["SeasonNumber"]).
                    attr("data-episodenumber",nextEpisodeCache[seriesId]["EpisodeNumber"]).
                    addClass("fa fa-download"))
              ));
                 /*
                      append(
                        $("<i></i>").
                        addClass("pauseSeries").
                        attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
                        addClass("fa fa-pause"))
                      )
                  */

            if(newEpisodeAirDate < now) {
              // Episode has already aired, so add to this existing
              if($("#unwatchedShowList").children().length == 0) {
                // First show - just add
                $("#unwatchedShowList").append(newEpisodeElement);    
              } else {
                appended = false;
                $('#unwatchedShowList').children().each(function (index, element) {
                  if(!appended) {
                    thisEpisodeAirDateString = $(element).find("span.episodeFirstAired").text();

                    if(newEpisodeAirDateString < thisEpisodeAirDateString) {
                      $(element).before(newEpisodeElement);
                      appended = true;
                    }
                  }
                });
                if(appended == false) {
                  $("#unwatchedShowList").append(newEpisodeElement);
                }
              }
            } else {
              // Episode airs in future, so add to future list          
              // Episode has already aired, so add to this existing
              if($("#unairedShowList").children().length == 0) {
                // First show - just add
                $("#unairedShowList").append(newEpisodeElement);    
              } else {
                appended = false;
                $('#unairedShowList').children().each(function (index, element) {
                  if(!appended) {
                    thisEpisodeAirDateString = $(element).find("span.episodeFirstAired").text();

                    if(newEpisodeAirDateString < thisEpisodeAirDateString) {
                      $(element).before(newEpisodeElement);
                      appended = true;
                    }
                  }
                });
                if(appended == false) {
                  $("#unairedShowList").append(newEpisodeElement);
                }
              }
            }
          }
        }
        $(".playedButton").click(function(event) { episodeNext.playedEpisode(event); });
        $(".facebookButton").click(function(event) { episodeNext.facebookShare(event); });
        $(".deleteButton").click(function(event) { episodeNext.deleteSeriesButton(event); });
        $(".pauseSeries").click(function(event) { episodeNext.pauseSeriesButton(event); })
        $("#deleteconfirm").click(function(event) { episodeNext.deleteSeriesConfirm(event); });
        $(".infoButtonShow").click(function(event) { episodeNext.showInfoShow(event); });
        $(".downloadButtonShow").click(function(event) { episodeNext.downloadShow(event); });
      }
      console.log("Build screen stop: " + ((new Date() - start)/1000));    

      episodeNext.stopspin("buildMainScreenFromCache");
    },

    /**
     * Checks the last time synchronizations have occurred for the cloud
     * services and updates the time in the settings menu.
     */
    updateSyncDisplay: function() {
       var episodeNext = this,
           today = new Date(),
           lastGoogleSyncEpoch = localStorage.getItem("lastGoogleSync"),
           googleFrequencySetting = episodeNext.getSetting("google.frequency"),
           lastTheTvDbSyncEpoch = localStorage.getItem("lastTvDbSync"),
           thetvdbFrequencySetting = episodeNext.getSetting("thetvdb.frequency");

       if(lastGoogleSyncEpoch != null) {
         lastGoogleSync = new Date(parseInt(lastGoogleSyncEpoch));

         if(today.toDateString() == lastGoogleSync.toDateString()) {
           $("#googlesynctime").text(lastGoogleSync.toLocaleTimeString());
         } else {
           $("#googlesynctime").text(lastGoogleSync.toLocaleDateString());         
         }
       }

       if(googleFrequencySetting !== undefined && googleFrequencySetting !== null) {
         $("#googlesync").val(googleFrequencySetting);
       }

       if(lastTheTvDbSyncEpoch != null) {
         lastTheTvDbSync = new Date(parseInt(lastTheTvDbSyncEpoch));

         if(today.toDateString() == lastTheTvDbSync.toDateString()) {
           $("#thetvdbsynctime").text(lastTheTvDbSync.toLocaleTimeString());
         } else {
           $("#thetvdbsynctime").text(lastTheTvDbSync.toLocaleDateString());         
         }
       }

       if(thetvdbFrequencySetting !== undefined && thetvdbFrequencySetting !== null) {
         $("#tvdbsync").val(thetvdbFrequencySetting);
       }
    },

    /**
     * Listens for the onclick event for an update frequency change.
     * @this {Element} the html element that allows switch frequency
     */
    changeSyncFrequency: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          syncKey = $(element).attr("data-sync"),
          frequency = $(element).val();
      
      episodeNext.setSetting(syncKey, frequency);
    },

    /**
     * Checks the sync frequency of each of the cloud services and if it is
     * past the time it will trigger another sync.
     */
    checkAndSync: function() {
      var episodeNext = this,
          googleFrequencyString = episodeNext.getSetting("google.frequency"),
          thetvdbFrequencyString = episodeNext.getSetting("thetvdb.frequency"),
          now = new Date(),
          lastGoogleSyncEpoch,
          googleFrequency,
          difference,
          lastTheTvDbSyncEpoch,
          thetvdbFrequency;

      console.log("Check and Sync");

      if(googleFrequencyString !== undefined && googleFrequencyString !== null && googleFrequencyString !== "0") {
        lastGoogleSyncEpoch = localStorage.getItem("lastGoogleSync");
        if((episodeNext.googleAuth == 'no') && lastGoogleSyncEpoch) {
          $("#googlemodal").modal({minWidth:"300",maxWidth:"300"});
        }
        if(lastGoogleSyncEpoch == null) {
          lastGoogleSyncEpoch = 0;
        }
        googleFrequency = parseInt(googleFrequencyString);
        lastGoogleSync = new Date(parseInt(lastGoogleSyncEpoch));
        difference = now - lastGoogleSync;             
        difference = difference / 60 / 1000;         
        if(difference > googleFrequency) {
          episodeNext.syncGoogle();
        }
      }

      if(thetvdbFrequencyString !== undefined && thetvdbFrequencyString !== null && thetvdbFrequencyString !== "0") {
        lastTheTvDbSyncEpoch = localStorage.getItem("lastTvDbSync");
        if(lastTheTvDbSyncEpoch == null) {
          lastTheTvDbSyncEpoch = 0
        }
        thetvdbFrequency = parseInt(thetvdbFrequencyString);
        lastTheTvDbSync = new Date(parseInt(lastTheTvDbSyncEpoch));
        difference = now - lastTheTvDbSync;             
        difference = difference / 60 / 1000;

        if(difference > thetvdbFrequency) {
          episodeNext.recache();
        }
      }
    },

    /**
     * Triggers a search for a new Episode of shows.
     */
    onSearch : function(event) {
      var episodeNext = this,
          showname = $("#searchtext").val();

      if(showname === null || showname === "") {
        // error
      } else {
        $("#searchtext").blur();
        $("#searchResultList").empty()
        episodeNext.searchForShow(showname);
      }
      return false;  
    },

    /**
     * Search for a show against the TV DB API and the create a result list.
     * @param {string} showname the name of the show to search for
     */
    searchForShow: function(showname) {
      var episodeNext = this,
          encodedName = encodeURIComponent(showname),
          searchUrl = this.getSeriesUrl + encodedName;

      this.spin("searchForShow");
      $.ajax({
        url: searchUrl,
        success: function(data,status) { episodeNext.searchForShowSuccess(data,status); },
        error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); }
      });
    },

    /**
     * Process the result of the show search API and display a result list.
     * @param data the response data
     * @param status the status of the response
     */
    searchForShowSuccess: function(data, status) {
      var episodeNext = this;

      $(data).find("Series").each(function(i, element) {
        var seriesId = $(element).find("seriesid").text(),
            seriesName = $(element).find("SeriesName").text(),
            firstAired = $(element).find("FirstAired").text(),
            newSeries;

        if(firstAired === null || firstAired === "") {
          firstAired = "unknown";
        }

        newSeries = $("<div></div>").
          attr("data-type","series").
          attr("data-seriesid",seriesId).
          addClass("seriesrow").
          append($("<div></div>").
            addClass("showname").
            html(seriesName)
          ).
          append($("<div></div>").
            addClass("originaldate").
            html(firstAired)
          ).
          append($("<div></div>").
            addClass("rightarrow").
            append(
              $("<i></i>").
              addClass("fa fa-chevron-right")
            )
          );

          $("#searchResultList").append(newSeries);  
      });
      $(data).find("Movies").each(function(i, element) {
        var seriesId = $(element).find("id").text(),
            seriesName = $(element).find("title").text(),
            firstAired = $(element).find("release_date").text(),
            newSeries;

        if(firstAired === null || firstAired === "") {
          firstAired = "unknown";
        }

        newSeries = $("<div></div>").
          attr("data-type","movie").
          attr("data-seriesid",seriesId).
          addClass("movierow").
          append($("<div></div>").
            addClass("showname").
            html(seriesName + " ").
            append($("<i></i>")
              .addClass("fa fa-film"))
          ).
          append($("<div></div>").
            addClass("originaldate").
            html(firstAired)
          ).
          append($("<div></div>").
            addClass("rightarrow").
            append(
              $("<i></i>").
              addClass("fa fa-chevron-right")
            )
          );

        $("#searchResultList").append(newSeries);  
      });  

      $(".seriesrow").click(function(event) { episodeNext.displayShowDetails(event); });
      $(".movierow").click(function(event) { episodeNext.displayMovieDetails(event); });
      episodeNext.stopspin("searchForShow");
    },

    /**
     * Displays details for a show
     * @this {Element} the info button clicked to show data for.
     */
    displayShowDetails: function(event) {
      var episodeNext = this,
          element = $(event.currentTarget).closest(".seriesrow"),
          seriesid = $(element).attr("data-seriesid"),
          searchUrl = episodeNext.getSeriesDetailsUrl + seriesid;

      episodeNext.spin("displayShowDetails");
      $.ajax({
        url: searchUrl,
        success: function(data, status) { episodeNext.searchDisplayShowSuccess(data,status); },
        error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); },
      });
    },

    /**
     * Success Callback for the Show Search API
     * @param data the response data
     * @param status the status of the response
     */
    searchDisplayShowSuccess: function(data, status) {
      var episodeNext = this,
          seriesId = $(data).find("Data Series id").text(),
          seriesName = $(data).find("Data Series SeriesName").text(),
          firstAiredDate = $(data).find("Data Series FirstAired").text(),
          overview = $(data).find("Data Series Overview").text(),
          bannersrc = episodeNext.bannerUrl + $(data).find("Data Series banner").text();  

      $(".bannerdiv").show();
      $("#addnewshowbutton").show();
      $(".posterdiv").hide();
      $("#addbannerimage").attr("src",bannersrc);
      $("#addshowtitle").html(seriesName);
      $("#addfirstaired").html(firstAiredDate);
      $("#addoverview").html(overview);
      $("#addnewshowbutton").attr("data-seriesid", seriesId);
      $("#addnewshowbutton").attr("data-type", "series");
      $("#addnewshowbuttonfacebook").attr("data-seriesid", seriesId);
      $("#addnewshowbuttonfacebook").attr("data-type", "series");

      $("#searchpage").slideUp('slow');
      $("#addshowpage").slideDown('slow');
      episodeNext.trackPageView("/addshowpage");

      episodeNext.stopspin("displayShowDetails"); 
    },

    /**
     * Displays details for a movie from TheMovieDB
     * @this {Element} the info button clicked to show data for.
     */
    displayMovieDetails: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          seriesid = $(element).attr("data-seriesid"),
          searchUrl = episodeNext.getMovieDetailsUrl + seriesid;

      episodeNext.spin("displayMovieDetails");
      $.ajax({
        url: searchUrl,
        success: function(data, status) { episodeNext.searchDisplayMovieSuccess(data, status); },
        error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); }
      });
    },

    /**
     * Success Callback for the Show Movie API
     * @param data the response data
     * @param status the status of the response
     */
    searchDisplayMovieSuccess: function(data, status) {
      var episodeNext = this,
          seriesId = $(data).find("Data Movie id").text(),
          seriesName = $(data).find("Data Movie title").text(),
          firstAiredDate = $(data).find("Data Movie releaseDate").text(),
          overview = $(data).find("Data Movie overview").text(),
          bannersrc = episodeNext.posterUrl + $(data).find("Data Movie posterPath").text();  

      $(".bannerdiv").hide();
      $("#addnewshowbutton").hide();
      $(".posterdiv").show();
      $("#addposterimage").attr("src",bannersrc);
      $("#addshowtitle").html(seriesName);
      $("#addfirstaired").html(firstAiredDate);
      $("#addoverview").html(overview);
      $("#addnewshowbutton").attr("data-seriesid", seriesId);
      $("#addnewshowbutton").attr("data-type", "movie");
      $("#addnewshowbuttonfacebook").attr("data-seriesid", seriesId);
      $("#addnewshowbuttonfacebook").attr("data-type", "movie");

      $("#searchpage").slideUp('slow');
      $("#addshowpage").slideDown('slow');
      episodeNext.trackPageView("/addmoviepage");

      episodeNext.stopspin("displayMovieDetails");
    },

    /**
     * Add a new show into the list of tracked shows.
     */
    addNewShow : function() {
      var episodeNext = this,
          seriesid = $("#addnewshowbutton").attr("data-seriesid");
      episodeNext.addShowToSeriesList(seriesid);
      $("#addshowpage").slideUp('slow');
      $("#mainpage").slideDown('slow');
      episodeNext.trackPageView("/index.html");
    },

    /**
     * Add a new show into the list of tracked shows and
     * adds the show into Facebook.
     */
    facebookAddNewShow : function() {
      var episodeNext = this,
          seriesid = $("#addnewshowbuttonfacebook").attr("data-seriesid"),
          dataType = $("#addnewshowbuttonfacebook").attr("data-type"),
          showUrl = episodeNext.facebookSeriesOgUrl + seriesid;

      if(dataType == "movie") {
        showUrl = episodeNext.facebookMovieOgUrl + seriesid;
        FB.api('/me/video.watches', 'post', { movie: showUrl }, function(response) {
          if (!response || response.error) {
            alert('Error occured: ' + JSON.stringify(response.error));
          } else {
            console.log('Post ID: ' + response.id);
          }
        });
        $("#addshowpage").slideUp('slow');
        $("#mainpage").slideDown('slow');
      } else {
        episodeNext.addNewShow();
        FB.api('/me/video.watches', 'post', { tv_show: showUrl }, function(response) {
          if (!response || response.error) {
            alert('Error occured: ' + JSON.stringify(response.error));
          } else {
            console.log('Post ID: ' + response.id);
          }
        });  
      }
    },

    /**
     * Display confirmation dialog to delete the series from the tracked list
     *   referenced by this button.
     *
     * @this {element} the button id used (element.data-seriesid)
     */
    deleteSeriesButton: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          seriesid = $(element).attr("data-seriesid");

      $("#deleteconfirm").
        attr("data-seriesid",seriesid);

      $("#deletemodal").modal({minWidth:"300",maxWidth:"300"});
    },

    /**
     * Delete the series from the tracked list referenced by this button.
     * @this {element} the button id used (element.data-seriesid)
     */
    deleteSeriesConfirm: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          seriesid = $(element).attr("data-seriesid");

      episodeNext.deleteSeries(seriesid);
      $.modal.close();
    },

    /**
     * Puts a series on pause so that episodes will be placed into the paused list
     *
     * @this {element} the button id used (element.data-seriesid)
     */
    pauseSeriesButton: function(event) {
      var element = event.currentTarget,
          seriesid = $(element).attr("data-seriesid");
    },

    /**
     * Get and display information about a particular show.
     * @this {element} the pressed infor button (element.data-seriesid)
     */
    showInfoShow: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          seriesid = $(element).attr("data-seriesid"),
          seriesUrl = episodeNext.getSeriesAllDetailsUrl + seriesid + "?includeall=true";

      episodeNext.spin("showInfoShow");
      $.ajax({
        url: seriesUrl,
        success: function(data,status) { episodeNext.seriesDisplayShowSuccess(data,status); },
        error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); },
      });
    },
    
    /**
     * Launch the Get My Shows Applications.
     */
    downloadShow: function(event) {
        var episodeNext = this,
            element = event.currentTarget,
            seriesid = $(element).attr("data-seriesid"),
            seriesName = $(element).attr("data-seriesName"),
            seasonNumber = $(element).attr("data-seasonnumber"),
            episodeNumber = $(element).attr("data-episodenumber"),
            searchString = seriesName 
              + " S" + episodeNext.pad(seasonNumber,2)
              + "E"  + episodeNext.pad(episodeNumber,2);  

        $("#downloadtext").html(searchString);
        $("#downloadmodal").modal({minWidth:"300",maxWidth:"300"});
    },
    

    /**
     * After pulling back information from TheTVDB this will display details
     * on the series and all episodes of the series.
     */
    seriesDisplayShowSuccess: function(data, status) {
      var episodeNext = this,
          seriesId = $(data).find("Data Series id").text(),
          seriesName = $(data).find("Data Series SeriesName").text(),
          firstAiredDate = $(data).find("Data Series FirstAired").text(),
          overview = $(data).find("Data Series Overview").text(),
          bannersrc = episodeNext.bannerUrl + $(data).find("Data Series banner").text(),
          toggleIcon = "fa fa-eye-slash",
          episodeName,
          seasonNumber,
          seasonid,
          episodeNumber,
          firstAired,
          watchedEpisodeKey,
          episodeKeyString,
          episodeKey,
          appendElement,
          watchedEpisodes; 

      $("#seasonlist").empty();
      $("#viewbannerimage").attr("src",bannersrc);
      $("#viewshowtitle").html(seriesName);
      $("#viewfirstaired").html(firstAiredDate);
      $("#viewoverview").html(overview);

      $("#mainpage").slideUp('slow');
      $("#showdetailspage").slideDown('slow');
      episodeNext.trackPageView("/showdetailspage");

      $(data).find("Data Episode").each(function(i,element) {
        episodeName = $(element).find("EpisodeName").text();
        seasonNumber = $(element).find("SeasonNumber").text(); 
        seasonid = $(element).find("seasonid").text();
        episodeNumber = $(element).find("EpisodeNumber").text();
        firstAired = $(element).find("FirstAired").text();
        watchedEpisodeKey = seriesId + "-" + $(element).find("id").text();
        episodeKeyString = seasonNumber + "x" + episodeNumber;
        episodeKey = parseInt(seasonNumber) * 100 + parseInt(episodeNumber);

        // Check if Season Exists and if not add the season bar
        if($("#"+seasonid).length > 0) {
          appendElement = $("#"+seasonid);
        } else {
          appendElement = $("<div></div>").
            attr("id",seasonid).
            addClass("season").append(
              $("<div></div>").
                addClass("seasonbar").
                text("Season " + seasonNumber).
                append(
                  $("<div></div>").
                  addClass("seasonbuttons").
                  append(
                    $("<i></i>").
                    addClass("watchseason").
                    addClass("fa fa-play-circle").
                    attr("data-seasonid",seasonid)
                  ).append(
                    $("<i></i>").
                    addClass("unwatchseason").
                    addClass("fa fa-eye-slash").
                    attr("data-seasonid",seasonid)
                  )
            ));
          $("#seasonlist").append(appendElement);
        }

        // watchedEpisodeKey
        // seriesid-episodeid
        // episodeKey in watchedEpisodes
        watchedEpisodes = episodeNext.getWatchedEpisodes();
        // console.log("Checking for: " + watchedEpisodeKey);
        if(watchedEpisodeKey in watchedEpisodes) {
          toggleIcon = "fa fa-eye-slash";
        } else {
          toggleIcon = "fa fa-play-circle";
        }

        appendElement.append(
          $("<div></div>").
          addClass("episodelist").
          attr("data-episode",episodeKey).
          attr("data-seasonid",seasonid).
          attr("data-watchedkey",watchedEpisodeKey).
          append(
            $("<div></div>").
            addClass("episodelistbuttons").
            append(
              $("<i></i>").
              addClass(toggleIcon).
              addClass("toggleWatched").
              attr("data-seasonid",seasonid).
              attr("data-watchedkey",watchedEpisodeKey)
            ).append(
              $("<i></i>").
              addClass("fa fa-info-circle")
            )
          ).append(
            $("<div></div>").
            addClass("episodelisttitle").
            html(episodeName)
          ).append(
            $("<div></div>").
            addClass("episodelistdetail").
            html(episodeKeyString + " " + firstAired)
          )
        );
      });

      $(".watchseason").click(function(event) { episodeNext.watchSeason(event); });
      $(".unwatchseason").click(function(event) { episodeNext.unwatchSeason(event); });
      $(".toggleWatched").click(function(event) { episodeNext.toggleWatchShow(event); });
      episodeNext.stopspin("showInfoShow");
    },

    facebookShare: function(event) {
        var episodeNext = this,
            element = event.currentTarget,
            seriesId = $(element).attr("data-seriesid"),
            episodeId = $(element).attr("data-episodeId"),
            seasonnumber = $(element).attr("data-seasonnumber"),
            episodenumber = $(element).attr("data-episodenumber"),
            seasonId = $(element).attr("data-seasonid");

        $("#facebookpost").
          attr("data-seriesid",seriesId).
          attr("data-episodeId",episodeId).
          attr("data-seasonnumber",seasonnumber).
          attr("data-episodenumber",episodenumber).
          attr("data-seasonid",seasonId);

        FB.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            $("#facebookmodal").modal({minWidth:"300",maxWidth:"300",height:'160'});
            console.log("Setting #simplemodal-container to Auto");
            $('#simplemodal-container').css('height', 'auto');
          } else {
            $("#mainpage").slideUp('slow');
            $("#settingspage").slideDown('slow');
            episodeNext.trackPageView("/settingspage");
          }
        });
      },

    facebookPlayedEpisode: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          episodeId = $(element).attr("data-episodeId"),
          seasonnumber = $(element).attr("data-seasonnumber"),
          episodenumber = $(element).attr("data-episodenumber"),
          seriesId = $(element).attr("data-seriesid"),
          episodeKey = seriesId + "-" + episodeId,
          showUrl = episodeNext.facebookSeriesOgUrl + seriesId + "/" + seasonnumber + "/" + episodenumber;

      episodeNext.spin("facebookPlayedEpisode");
      episodeNext.removeSeriesFromNextEpisodeCache(seriesId);

      $.modal.close();

      FB.api('/me/video.watches', 'post', { tv_episode: showUrl }, function(response) {
        if (!response || response.error) {
          alert('Error occured: ' + JSON.stringify(response.error));
        } else {
          console.log('Post ID: ' + response.id);
          episodeNext.watchSingleEpisode(episodeKey);
        }
      });  
      episodeNext.stopspin("facebookPlayedEpisode");
    },

    playedEpisode: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          seriesId = $(element).attr("data-seriesid"),
          episodeId = $(element).attr("data-episodeId"),
          episodeKey = seriesId + "-" + episodeId;

      episodeNext.removeSeriesFromNextEpisodeCache(seriesId);
      episodeNext.watchSingleEpisode(episodeKey);
    },

    toggleWatchShow: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          watchedkey = $(element).attr("data-watchedkey"),
          watchedEpisodes;

      if($(element).hasClass("fa fa-play-circle")) {
        $(element).removeClass("fa fa-play-circle");
        $(element).addClass("fa fa-eye-slash");

        // Tracking inside this method
        episodeNext.watchSingleEpisode(watchedkey);
      } else {
        watchedEpisodes = episodeNext.getWatchedEpisodes();
        $(element).removeClass("fa fa-eye-slash");
        $(element).addClass("fa fa-play-circle");
        delete watchedEpisodes[watchedkey];
        episodeNext.trackShowAction("Episode", "Delete", watchedkey);

        // TODO: Change Save Watched to False and just recache a single episode
        episodeNext.saveWatchedEpisodes(watchedEpisodes, true);
        // Delete realtime from Cloud
        episodeNext.deleteEpisodeFromCloud(watchedkey);    
      }
    },

    /**
     * Adds a single watch key into the local store and the cloud.
     *
     * @param {string} watchedEpisodeKey the key of the episode to mark as watched
     *        in the format of "{seriesId}-{episodeId}"
     */
    watchSingleEpisode: function(watchedEpisodeKey) {
        var episodeNext = this,
        	seriesId = (watchedEpisodeKey.split("-"))[0];
            watchedEpisodes = episodeNext.getWatchedEpisodes(),
            watchedTime = (new Date()).getTime();
            
      watchedEpisodes[watchedEpisodeKey] = watchedTime;
      episodeNext.trackShowAction("Episode", "Add", watchedEpisodeKey);

      // Realtime Add to Cloud
      episodeNext.addEpisodeToCloud(watchedEpisodeKey, watchedTime);

      // Save the new watchlist
      episodeNext.saveWatchedEpisodes(watchedEpisodes, false);

      // Recache Single Episode
      episodeNext.recacheSingleEpisode(seriesId);
    },

    /**
     * Adds a show to the series list locally and into the cloud systems.
     *
     * @param {string} seriesId the key for the series that is going to be tracked
     */
    addShowToSeriesList: function(seriesId) {
      var episodeNext = this,
          seriesList = episodeNext.getSeriesList(),
          addTime = (new Date()).getTime();

      seriesList[seriesId] = addTime;
      episodeNext.trackShowAction("Series", "Add", seriesId);
      episodeNext.addSeriesToCloud(seriesId, addTime);
      episodeNext.saveSeriesList(seriesList);
      episodeNext.checkPopupFloaters();
    },

    /**
     * Delete the series from the local storage and cloud.
     *
     * @param {string} seriesId the key of the series to be deleted
     */
    deleteSeries: function(seriesId) {
      // Treat as Map
      var episodeNext = this,
          seriesList = episodeNext.getSeriesList();

      delete seriesList[seriesId];
      episodeNext.trackShowAction("Series", "Delete", seriesId);
      episodeNext.saveSeriesList(seriesList);
      episodeNext.checkPopupFloaters();
      episodeNext.deleteSeriesFromCloud(seriesId);
    },

    getSeriesList: function() {
      var episodeNext = this,
          result = {},
          seriesList = localStorage.getItem("seriesList"),
          tempResult,
          objectType,
          i;

      if(seriesList !== null) {
        tempResult = JSON.parse(seriesList);
        objectType = Object.prototype.toString.call( tempResult );
        if(objectType  === '[object Array]') {
          // console.log("Upgrading Series list to map");
          for(i=0; i<tempResult.length; i++) {
            result[tempResult[i]] = (new Date()).getTime();
          }
          episodeNext.saveSeriesList(result);
        } else {
          result = tempResult;
        }
      }

      return result;
    },

    getWatchedEpisodes: function() {
      var episodeNext = this,
          result = {},
          watchedEpisodes = localStorage.getItem("watchedEpisodes"),
          objectType;

      if(watchedEpisodes !== null) {
        result = JSON.parse(watchedEpisodes);
        objectType = Object.prototype.toString.call( result );
        // console.log("Watched Episodes type: " + objectType);
      }

      return result;
    },

    saveSeriesList: function(seriesList) {
      var episodeNext = this,
          seriesListJson = JSON.stringify(seriesList),
          objectType = Object.prototype.toString.call( seriesList ),
          result = {},
          i;

      if(objectType  === '[object Array]') {
        // console.log("Upgrading Series list to map");
        for(i=0; i<tempResult.length; i++) {
          result[tempResult[i]] = (new Date()).getTime();
        }
        seriesListJson = JSON.stringify(result);
      }
      localStorage.setItem("seriesList", seriesListJson);
      episodeNext.recache();
    },

    getSetting: function(settingKey) {
      var episodeNext = this,
          settingsJson = {};

      if(this.settings === undefined || this.settings === null) {
        settingsJson = localStorage.getItem("settings");
        if(settingsJson !== null) {      
          episodeNext.settings = JSON.parse(settingsJson);
        } else {
          episodeNext.settings = {};
        }
      }
      return episodeNext.settings[settingKey];
    },

    setSetting: function(settingKey, settingValue) {
      var episodeNext = this,
          settingsJson = {};

      if(episodeNext.settings === undefined || this.settings === null) {
        settingsJson = localStorage.getItem("settings");
        if(settingsJson !== null) {      
          episodeNext.settings = JSON.parse(settingsJson);
        } else {
          episodeNext.settings = {};
        }
      }

      episodeNext.settings[settingKey] = settingValue;
      localStorage.setItem("settings", JSON.stringify(this.settings));
    },

    /**
     * Removes a series from the Next Episode Cache so that it can quickly vanish
     * from display.  This series will come back as soon as it is recached.
     *
     * @param {string} seriesId the id of the series to remove.
     */
    removeSeriesFromNextEpisodeCache: function(seriesId) {
      var nextEpisodeCacheJson = localStorage.getItem("nextEpisodeCache"),
          nextEpisodeCache = JSON.parse(nextEpisodeCacheJson);

      delete nextEpisodeCache[seriesId];
      localStorage.setItem("nextEpisodeCache",JSON.stringify(nextEpisodeCache));

      // Mark the episode as played:
      if($("div#series-"+seriesId)) {
        $("div#series-"+seriesId).addClass("played");
      }

      // buildMainScreenFromCache();
    },

    /**
     * Saves the watched episode list into the localstorage object
     *
     * @param {Array.Object} watchedEpisodes is a array of watched episode objects
     * @param {boolean} requestRecache says whether this update should also
     *        trigger a full recache.
     */
    saveWatchedEpisodes: function(watchedEpisodes, requestRecache) {
      var episodeNext = this,
          watchedEpisodesJson = JSON.stringify(watchedEpisodes);

      localStorage.setItem("watchedEpisodes", watchedEpisodesJson);
      if(requestRecache == true) {
        episodeNext.recache();
      }
    },

    /**
     * Does a realtime add of a watched key into the cloud stores if they are
     * authenticated.
     *
     * @param {string} watchedEpisodeKey Provides the key to the episode that
     *        has been watched.  They key is in the format of
     *        "{seriesId}-{episodeId}"
     * @param {number} watchedTime an epoch indicator of when the show was watched
     */
    addEpisodeToCloud: function(watchedEpisodeKey, watchedTime) {
      var episodeNext = this,
          now = (new Date()).getTime();

      // If Google is Auth'ed add to it:
      if(episodeNext.googleAuth == 'yes') {
        $.ajax({
          url: episodeNext.googleRootUrl+"/data/watched",
          type: "POST",
          data: { "watchedKey": watchedEpisodeKey, "updated": now },
          error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); },
          });
      }  
    },

    /**
     * Does a realtime add of a series into the cloud stores if they are
     * authenticated.
     *
     * @param {string} seriesKey Provides the key to the series that should
     *        be tracked
     * @param {number} watchedTime an epoch indicator of when the show was watched
     */
    addSeriesToCloud: function(seriesKey, watchedTime) {
      var episodeNext = this,
          now = (new Date()).getTime();

      // If Google is Auth'ed add to it:
      if(episodeNext.googleAuth == 'yes') {
        $.ajax({
          url: episodeNext.googleRootUrl+"/data/series",
          type: "POST",
          data: { "seriesId": seriesKey, "updated": now },
          error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); }
        });
      }  
    },

    /**
     * Does a realtime delete of a watched key from the cloud stores if they are
     * authenticated.
     *
     * @param {string} watchedEpisodeKey Provides the key to the episode that
     *        has been watched. The key is in the format of
     *        "{seriesId}-{episodeId}"
     */
    deleteEpisodeFromCloud: function(watchedEpisodeKey) {
      var episodeNext = this;

      // Delete realtime from Google
      if(episodeNext.googleAuth == 'yes') {
        $.ajax({
          url: episodeNext.googleRootUrl+"/data/watched/"+watchedEpisodeKey,
          type: "DELETE",
          error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); }
        });
      }  
    },

    /**
     * Does a realtime delete of a series from the cloud stores if they are
     * authenticated.
     *
     * @param {string} seriesId the key of the series to remove
     */
    deleteSeriesFromCloud: function(seriesId) {
      var episodeNext = this;

      if(episodeNext.googleAuth == 'yes') {
        $.ajax({
          url: episodeNext.googleRootUrl+"/data/series/"+seriesId,
          type: "DELETE",
          error: function(jqXHR,textStatus) { episodeNext.genericError(jqXHR,textStatus); }
        });
      }
    },

    /*
     * Deletes an element out of local storage
     */
    resetLocalStorage: function() {
      localStorageName = $(this).attr("data-storagename");
      localStorage.removeItem(localStorageName);
      updateSyncDisplay();
    },

    /**
     * Mark an entire season as watched.
     */
    watchSeason: function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          seasonid = $(element).attr("data-seasonid"),
          watchedEpisodes = episodeNext.getWatchedEpisodes(),
          dirty = false,
          watchedEpisodeKey,
          watchedTime;

      $( "div.episodelist[data-seasonid=" + seasonid + "]" ).each(function(i) {
        watchedEpisodeKey = $(this).attr("data-watchedkey");
        // console.log("Watched: " + watchedEpisodeKey);
        if(!(watchedEpisodeKey in watchedEpisodes)) {
          dirty = true;
          watchedTime = (new Date()).getTime();
          watchedEpisodes[watchedEpisodeKey] = watchedTime;

          // Realtime Add to Cloud
          episodeNext.addEpisodeToCloud(watchedEpisodeKey, watchedTime);
          
          $(this).find("i.toggleWatched").each(function(i) {
            $(this).removeClass("fa fa-play-circle");
            $(this).addClass("fa fa-eye-slash");
          });
        }
      });

      if(dirty) {
        episodeNext.saveWatchedEpisodes(watchedEpisodes, true);
      }
    },

    /**
     * Triggered from the DOM - marks an entire season as unwatched by working
     * all of the child elements and pulling out the episode keys.
     *
     * @this {element} The dom element that holds the season
     */
    unwatchSeason : function(event) {
      var episodeNext = this,
          element = event.currentTarget,
          seasonid = $(element).attr("data-seasonid"),
          dirty = false,
          watchedEpisodes = episodeNext.getWatchedEpisodes(),
          watchedEpisodeKey;
          
      $("div.episodelist[data-seasonid=" + seasonid + "]" ).each(function(i) {
        watchedEpisodeKey = $(this).attr("data-watchedkey");
        // console.log("Unwatched key: " + watchedEpisodeKey);
        if(watchedEpisodeKey in watchedEpisodes) {
          dirty=true;
          delete watchedEpisodes[watchedEpisodeKey];

          episodeNext.deleteEpisodeFromCloud(watchedEpisodeKey);

          $(this).find("i.toggleWatched").each(function(i) {
            // console.log("Toggle Eye key: " + watchedEpisodeKey);
            $(this).removeClass("fa fa-eye-slash");
            $(this).addClass("fa fa-play-circle");
          });
        }
      });
      if(dirty) {
        episodeNext.saveWatchedEpisodes(watchedEpisodes, true);
      }
    },

    /**
     * Start the spinning process.
     *
     * @param {string} desc a description of activity starting the spinner,
     *        for debug usages
     */
    spin : function(desc) {
      console.log("Spin Start: " + desc);
      this.spinCount++;
      $("#spinner").show();
      $("#spinner").spin();  
    },

    /**
     * Stops the spinning process.
     *
     * @param {string} desc a description of activity starting the spinner,
     *        for debug usages
     */
    stopspin : function(desc) {
      console.log("Spin Stop: " + desc);
      this.spinCount--;
      if(this.spinCount <= 0) {
        this.spinCount = 0;
        $("#spinner").hide();
        $("#spinner").spin(false);
      }
    },

    parseDate: function(input) {
      var parts = input.split('-');
      // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
      return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
    },

    genericError: function(jqXHR, textStatus) {
      var episodeNext = this;

      episodeNext.stopspin("genericError");
      alert("Failure: textStatus = [" + textStatus + "], jqXHR.response [" + JSON.stringify(jqXHR.response) + "]");
      // episodeNext.console.log("Failure: textStatus = [" + textStatus + "], jqXHR.response [" + JSON.stringify(jqXHR.response) + "]");
    },

    //////
    // TheTV Sync Section - Should move to its own module and be controlled
    // through web workers.
    /////
    recache: function() {
      var episodeNext = this,
          thetvdbWebWorker;

      // if( window.Worker ) {
      //  console.log("Using web worker!");
      //  thetvdbWebWorker = new Worker('js/thetvdb.js' + '?bust=' + (new Date).getTime());
      //  thetvdbWebWorker.postMessage('{"function":"recache"}');
      //} else {
      //  console.log("No web worker...");
        thetvdb.setEpisodeNext(episodeNext);
        thetvdb.recache();
      //}
    },
    
    /**
     * Requests a resync of a single episode.
     * @param {string} episode key for a single episode {seriesId}-{episodeId}
     */
    recacheSingleEpisode: function(seriesId) {
    	var episodeNext = this;
    	
    	thetvdb.setEpisodeNext(episodeNext);
    	thetvdb.recacheSingleEpisode(seriesId);
    },

    syncGoogle: function() {
      var episodeNext = this;

      googlesync.setEpisodeNext(episodeNext);
      googlesync.syncGoogle();
    },

    /** START: Google Analytics */
    /**
     * Tracks a page view event.
     * @param {string} pagename the name of the page to be tracked.
     */
    trackPageView: function(pagename) {
      var g = window._gaq || (window._gaq = []);

      g.push(['_setAccount', this.googleAnalyticsAccount]);
      g.push(['_trackPageview', pagename]);
    },

    /**
     * Tracks an action against a sync service
     * @param {string} serviceName the name of the service being synced
     * @param {string} action the action of the syncronization
     */
    trackSyncService: function(serviceName, action) {
      var g = window._gaq || (window._gaq = []);

      g.push(['_setAccount', this.googleAnalyticsAccount]);
      g.push(['_trackEvent', serviceName, action]);
    },

    /**
     * Tracks the completion of syncronization
     * @param {string} serviceName the name of the service being synced
     * @param {string} action the action of the syncronization
     * @param {string} label the completion action (e.g. Time)
     * @param {number} value the value, typically the amount of milliseconds to sync
     */
    trackSyncComplete: function(serviceName, action, label, value) {
      var g = window._gaq || (window._gaq = []);

      g.push(['_setAccount', this.googleAnalyticsAccount]);
      g.push(['_trackEvent', serviceName, action, label, value]);
    },

    /**
     * Tracks the action against a show
     * @param {string} category either "Series" or "Episode"
     * @param {string} action the action taken to the series or episode
     * @param {string} label the label for the action - which series or episode
     */
    trackShowAction: function(category, action, label) {
      var g = window._gaq || (window._gaq = []);

      g.push(['_setAccount', this.googleAnalyticsAccount]);
      g.push(['_trackEvent', category, action, label]);
    },
    /** END: Google Analytics */

    /**
     * Add left padding to a number.
     * @param {string} n the number to left pad
     * @param {string} width the width to pad until
     * @param {string} z the string to pad with - defaults to 0
     */
    pad: function(n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    
  };
});