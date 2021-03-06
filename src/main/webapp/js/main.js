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

/** 
 * The Dropbox App Key used to identify to Dropbox for the OAuth connection
 * @define {string}
 * @private
 */
var DROPBOX_APP_KEY = 'daywyfneqb6yg8i';

/** 
 * Google Analytics account used to push actions to GA
 * @define {string} 
 * @private
 */
var googleAnalyticsAccount = 'UA-210230-2';

/** 
 * Dropbox Client exposed for easy access in the browser console. 
 * @private
 */
var client = new Dropbox.Client({key: DROPBOX_APP_KEY});

/**
 * Defines if the Google Authenticated Session has been established.
 * @type {boolean}
 * @private
 */
var googleAuth = false;

/** 
 * The Dropbox Table that holds a list of series that are being tracked. 
 * @private
 */
var seriesListTable;

/** 
 * The Dropbox Table that holdsa list of espides that are watched.
 * @private
 */
var watchedEpisodesTable;

/**
 * The TV DB URL base for the API
 * @define {string}
 * @private
 */
var TheTbDbUrlBase = "http://thetvdb.com";

/**
 * The base URL for loading banner images from the TV DB API
 * @define {string}
 * @private
 */
var bannerUrl = "https://thewirewatcher.appspot.com/api/banners/";

/**
 * The base URL for loading movie posters from the Movie DB API.
 * @define {string}
 * @private
 */
var posterUrl = "https://image.tmdb.org/t/p/w780";

/**
 * The base URL for loading series search information.
 * @define {string}
 * @private
 */
var getSeriesUrl = "https://thewirewatcher.appspot.com/api/search?searchterm=";

/**
 * The base URL for the get series API.  This proxies the request to 
 * The TV DB APIs
 *
 * @define {string}
 * @private
 */
var getSeriesDetailsUrl = "https://thewirewatcher.appspot.com/api/series/";

/**
 * The base URL for the get movies API.  This proxies the request to 
 * The Movie DB APIs
 *
 * @define {string}
 * @private
 */

var getMovieDetailsUrl = "https://thewirewatcher.appspot.com/api/movies/";

/**
 * The base URL for the get movie API.  This proxies the request to 
 * The TV DB APIs
 *
 * @define {string}
 * @private
 */
var getMovieDetailsUrl = "https://thewirewatcher.appspot.com/api/movies/";

/**
 * The base URL for the get series episodes API.  This proxies the request to 
 * The TV DB APIs
 *
 * @define {string}
 * @private
 */
var getSeriesAllDetailsUrl = "https://thewirewatcher.appspot.com/api/all/"
// var getSeriesAllDetailsUrl = "http://localhost:8080/api/all/"

/**
 * The base URL for Syncing with the Google Cloud Backend API.
 * @define {string}
 * @private
 */
var googleRootUrl = "https://thewirewatcher.appspot.com/api/v1"
// var googleRootUrl = "http://localhost:8080/api/v1"

/**
 * The base URL for the Open Graph object of shows.
 * The API is defined as:
 * facebookSeriesOgUrl/{seriesId}[/{episodeId}]
 * 
 * @define {string}
 * @private
 */
var facebookSeriesOgUrl = "https://thewirewatcher.appspot.com/showdetails/";

/**
 * The base URL for the Open Graph object of the movies
 * @define {string}
 * @private
 */
var facebookMovieOgUrl = "https://thewirewatcher.appspot.com/moviedetails/";

/**
 * Counter for spin requests.  Each request to start the spinner increments
 * this counter and each request to stop the spin decrements this counter.
 * When the counter is at zero, the spinning stops.
 * @type {number}
 */
var spinCount = 0;

/**
 * When running through loops of synchronization, this indicates the amount
 * of time to wait in between loops while doing high priority work.
 * @define {number}
 */
var timeoutDelay = 0;

/**
 * When running through loops of synchronization, this indicates a longer
 * wait time to use for lower priority tasks so there is more CPU for the
 * user interactions.
 * @define {number}
 */
var slowTimeoutDelay = 100;

/**
 * Holds a simple local settings mapping.
 * @type {Object.<string,string>}
 * @private
 */
var settings;

/**
 * Defines the amount of space that the title bar overlays.
 * @type {number}
 * @private
 */
var topDistance = 44;

$(document).ready(function() {
	spin("Ready");
	// Update the display first!
	buildMainScreenFromCache();

	$("#addshowbutton").click(function() {
		$("#mainpage").slideUp('slow');
		$("#searchpage").slideDown('slow');
		trackPageView("/searchpage");
		$("#searchtext").focus();
	});

	$("#cancelsearch").click(function() {
		$("#mainpage").slideDown('slow');
		$("#searchpage").slideUp('slow');
		trackPageView("/index.html");
	});
  
	$("#canceladdshowpage").click(function() {
		$("#searchpage").slideDown('slow');  
		$("#addshowpage").slideUp('slow');
		trackPageView("/searchpage");
	});
  
	$("#settingsbutton").click(function() {
		updateSyncDisplay();  
		$("#mainpage").slideUp('slow');
		$("#settingspage").slideDown('slow');
				
		trackPageView("/settingspage");
	});

	$("#settingsdone").click(function() {
		$("#settingspage").slideUp('slow');
		$("#mainpage").slideDown('slow');	  
		trackPageView("/index.html");
	});
  
	$("#showdetailsdone").click(function() {
		$("#showdetailspage").slideUp('slow');
		$("#mainpage").slideDown('slow');	  
		trackPageView("/index.html");
	});

	$("#showaboutthetvdb").click(function(){
		$("#settingspage").slideUp('slow');
		$("#aboutthetvdb").slideDown('slow');
		trackPageView("/aboutthetvdb");
	});
  
	$("#aboutthetvdbback").click(function(){
		$("#aboutthetvdb").slideUp('slow');
		$("#settingspage").slideDown('slow');
		trackPageView("/settingspage");
	});
  
	$("#allshowsseasonbar").click(function() {
		if($(this).attr("data-status") == "hidden") {
		   	$(this).attr("data-status","shown");
		   	$("#allshowsexpander").removeClass("fa fa-chevron-circle-right");
		   	$("#allshowsexpander").addClass("fa fa-chevron-down");
		   	$("#showlist").show();
			$(document.body).animate({
			    'scrollTop': $('#allshowsseasonbar').offset().top-topDistance
			}, 1000);	   	
		} else {
		   	$(this).attr("data-status","hidden");
		   	$("#allshowsexpander").removeClass("fa fa-chevron-down");
		   	$("#allshowsexpander").addClass("fa fa-chevron-circle-right");
		   	$("#showlist").hide();
		 }
	});

	$("#unairedseasonbar").click(function() {
		if($(this).attr("data-status") == "hidden") {
		   	$(this).attr("data-status","shown");
		   	$("#unairedseasonexpander").removeClass("fa fa-chevron-circle-right");
		   	$("#unairedseasonexpander").addClass("fa fa-chevron-down");
		   	$("#unairedShowList").show();
			$(document.body).animate({
			    'scrollTop': $('#unairedseasonbar').offset().top-topDistance
			}, 1000);	   	
		} else {
			$(this).attr("data-status","hidden");
			$("#unairedseasonexpander").removeClass("fa fa-chevron-down");
			$("#unairedseasonexpander").addClass("fa fa-chevron-circle-right");
			$("#unairedShowList").hide();
		}
	});

    
	$("#addnewshowbutton").click(addNewShow);
	$("#addnewshowbuttonfacebook").click(facebookAddNewShow);
	$('#addshowform').submit(onSearch);
	$("#recache").click(recache);
	$(".cancelmodal").click(function() {$.modal.close()});
	$("#facebookpost").click(facebookPlayedEpisode);
	$("#addtohome .close").click(function() {
		$("#addtohome").slideUp('slow');
		localStorage.setItem("hideaddto","true");
	});
  
	$("#dropboxSyncButton").click(syncDropbox);
	$('#dropboxLoginButton').click(function (e) {
		e.preventDefault();
  	    trackSyncService("Dropbox","Login");
		client.authenticate();
	});
	$('#dropboxLogoutButton').click(logoutDropbox);

	$("#googleSyncButton").click(syncGoogle);
	$("#thetvdbsync").click(recache);
	
	$("#dropboxsync").change(changeSyncFrequency);
	$("#tvdbsync").change(changeSyncFrequency);
	$("#googlesync").change(changeSyncFrequency);

	$(".resetLocalStorage").click(resetLocalStorage);

  	// Dropbox Authentications
	client.authenticate({interactive:false}, function (error) {
		if (error) {
			alert('Authentication error: ' + error);
		}
	});
	
	if (client.isAuthenticated()) {
		trackSyncService("Dropbox","Authorized");
		
		// Client is authenticated. Display UI.
		$('#dropboxlogin').hide();
		$("#dropboxlogout").show();

		client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
			if (error) {
				alert('Error opening default datastore: ' + error);
			}

			console.log("Dropbox Authenticated");
			seriesListTable = datastore.getTable('seriesListTable');
			watchedEpisodesTable = datastore.getTable('watchedEpisodesTable');
		});
	}
	
	checkGoogleAuth();
	checkPopupFloaters();
	updateSyncDisplay();
	
	// Wait 5 seconds and then check
	setTimeout(checkAndSync,10000);
	stopspin("Ready");
});

/**
 * Checks the Google Authentication Status by making a JSON call tot he status
 * API.
 */
function checkGoogleAuth() {
    $.ajax({
      url: googleRootUrl+"/google/status?returnPath=" + encodeURIComponent(document.location),
      success: checkGoogleAuthSuccess,
      error: genericError
    });
}

/**
 * Success result from the Check Google auth function.  This will update the Google
 * login screen as appropriate.
 */
function checkGoogleAuthSuccess(data, status) {
	if(data.googleLoginStatus == "true") {
		trackSyncService("Google","Authorized");
    	googleAuth = true;
        $("#googlelogin").hide();
        $("#googlelogout").show();
        $("#googleLoginButton").click(function() {
        	trackSyncService("Google","Login");
	        window.location.replace(data.googleLoginUrl);
        });
        $("#googleloginmod").click(function() {
        	trackSyncService("Google","Login");
	        window.location.replace(data.googleLoginUrl);
        });	        
        $("#googleLogoutButton").click(function() {
        	trackSyncService("Google","Logout");
	        window.location.replace(data.googleLogoutUrl);
        });	        
    } else {
    	googleAuth = false;
        $("#googlelogin").show();
        $("#googlelogout").hide();
        $("#googleLoginButton").click(function() {
        	trackSyncService("Google","Login");
	        window.location.replace(data.googleLoginUrl);
        });
        $("#googleloginmod").click(function() {
        	trackSyncService("Google","Login");
	        window.location.replace(data.googleLoginUrl);
        });	        
        $("#googleLogoutButton").click(function() {
        	trackSyncService("Google","Logout");
	        window.location.replace(data.googleLogoutUrl);
        });
	}
}

/**
 * Checks if there are any series currently being tracked and
 * shows the help notes if there are not.
 */
function checkPopupFloaters() {
  var seriesMap = getSeriesList();
  if(seriesMap==null ||  Object.keys(seriesMap).length == 0) {
	  $(".help").show();
  } else {
	  $(".help").hide();
	  if(localStorage.getItem("hideaddto") == null 
	      && window
	      && window.navigator
	      && window.navigator.standalone == false) {
	      
		$("#addtohome").slideDown('slow');
		trackPageView("/addtohome");
	  }
  }

}

/**
 * Checks the last time synchronizations have occurred for the cloud
 * services and updates the time in the settings menu.
 */
function updateSyncDisplay() {
   var today = new Date(),
       lastDropboxSyncEpoch = localStorage.getItem("lastDropboxSync"),
       dropboxFrequencySetting = getSetting("dropbox.frequency"),
       lastGoogleSyncEpoch = localStorage.getItem("lastGoogleSync"),
       googleFrequencySetting = getSetting("google.frequency"),
       lastTheTvDbSyncEpoch = localStorage.getItem("lastTvDbSync"),
       thetvdbFrequencySetting = getSetting("thetvdb.frequency");
       
   if(lastDropboxSyncEpoch != null) {
	   lastDropboxSync = new Date(parseInt(lastDropboxSyncEpoch));
	   
	   if(today.toDateString() == lastDropboxSync.toDateString()) {
	       $("#dropboxsynctime").text(lastDropboxSync.toLocaleTimeString());
       } else {
	       $("#dropboxsynctime").text(lastDropboxSync.toLocaleDateString());	       
       }
   }
   
   if(dropboxFrequencySetting !== undefined && dropboxFrequencySetting !== null) {
	   $("#dropboxsync").val(dropboxFrequencySetting);
   }
   
   
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
}

/**
 * Listens for the onclick event for an update frequency change.
 * @this {Element} the html element that allows switch frequency
 */
function changeSyncFrequency() {
	var syncKey = $(this).attr("data-sync"),
	    frequency = $(this).val();
	
    setSetting(syncKey, frequency);
}

/**
 * Triggers a dropbox logout and updates the settings page.
 */
function logoutDropbox() {
	if (client.isAuthenticated()) {
	  trackSyncService("Dropbox","Logout");
	  client.signOut(function(){
		$("#dropboxlogout").hide();		  
		$('#dropboxlogin').show();
	  });
	}
}

/**
 * Checks the sync frequency of each of the cloud services and if it is
 * past the time it will trigger another sync.
 */
function checkAndSync() {
	var googleFrequencyString = getSetting("google.frequency"),
	    dropboxFrequencyString = getSetting("dropbox.frequency"),
	    thetvdbFrequencyString = getSetting("thetvdb.frequency"),
	    now = new Date(),
	    lastGoogleSyncEpoch,
	    googleFrequency,
	    difference,
	    lastDropboxSyncEpoch,
	    dropboxFrequency,
	    lastTheTvDbSyncEpoch,
	    thetvdbFrequency;

    if(googleFrequencyString !== undefined && googleFrequencyString !== null && googleFrequencyString !== "0") {
	    lastGoogleSyncEpoch = localStorage.getItem("lastGoogleSync");
		if(!googleAuth && lastGoogleSyncEpoch) {
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
	         syncGoogle();
         }
    }
		
    if(dropboxFrequencyString !== undefined && dropboxFrequencyString !== null && dropboxFrequencyString !== "0") {
	    lastDropboxSyncEpoch = localStorage.getItem("lastDropboxSync");
	    if(lastDropboxSyncEpoch == null) {
	      lastDropboxSyncEpoch = 0;
	    }
        dropboxFrequency = parseInt(dropboxFrequencyString);
	    lastDropboxSync = new Date(parseInt(lastDropboxSyncEpoch));
		difference = now - lastDropboxSync;             
		difference = difference / 60 / 1000;         
         if(difference > dropboxFrequency) {
	         syncDropbox();
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
	         recache();
         }
    }	

}

/**
 * Start the spinning process.
 *
 * @param {string} desc a description of activity starting the spinner,
 *        for debug usages
 */
function spin(desc) {
  console.log("Spin Start: " + desc);
  spinCount++;
  $("#spinner").show();
  $("#spinner").spin();	
}

/**
 * Stops the spinning process.
 *
 * @param {string} desc a description of activity starting the spinner,
 *        for debug usages
 */
function stopspin(desc) {
  console.log("Spin Stop: " + desc);
  spinCount--;
  if(spinCount <= 0) {
    spinCount = 0;
    $("#spinner").hide();
    $("#spinner").spin(false);
  }
}

/**
 * Triggers a search for a new Episode of shows.
 */
function onSearch() {
  var showname = $("#searchtext").val();
  if(showname === null || showname === "") {
	  // error
  } else {
    $("#searchtext").blur();
    $("#searchResultList").empty()
    searchForShow(showname);
  }
  return false;	
}

/**
 * Search for a show against the TV DB API and the create a result list.
 * @param {string} showname the name of the show to search for
 */
function searchForShow(showname) {
    var encodedName = encodeURIComponent(showname),
        searchUrl = getSeriesUrl + encodedName;
    
    spin("searchForShow");
    $.ajax({
      url: searchUrl,
      success: searchForShowSuccess,
      error: genericError
    });
}

/**
 * Process the result of the show search API and display a result list.
 * @param data the response data
 * @param status the status of the response
 */
function searchForShowSuccess(data, status) {
	$(data).find("Series").each(function(i) {
		var seriesId = $(this).find("seriesid").text(),
		    seriesName = $(this).find("SeriesName").text(),
		    firstAired = $(this).find("FirstAired").text(),
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
	$(data).find("Movies").each(function(i) {
		var seriesId = $(this).find("id").text(),
		    seriesName = $(this).find("title").text(),
		    firstAired = $(this).find("release_date").text(),
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
	
	
	
	$(".seriesrow").click(displayShowDetails);
	$(".movierow").click(displayMovieDetails);
    stopspin("searchForShow");
}

/**
 * Displays details for a show
 * @this {Element} the info button clicked to show data for.
 */
function displayShowDetails() {
    var seriesid = $(this).attr("data-seriesid"),
        searchUrl = getSeriesDetailsUrl + seriesid;

	spin("displayShowDetails");
    $.ajax({
      url: searchUrl,
      success: searchDisplayShowSuccess,
      error: genericError
    });
}

/**
 * Displays details for a show
 * @this {Element} the info button clicked to show data for.
 */
function displayMovieDetails() {
    var seriesid = $(this).attr("data-seriesid"),
        searchUrl = getMovieDetailsUrl + seriesid;

	spin("displayMovieDetails");
    $.ajax({
      url: searchUrl,
      success: searchDisplayMovieSuccess,
      error: genericError
    });
}


/**
 * Success Callback for the Show Search API
 * @param data the response data
 * @param status the status of the response
 */
function searchDisplayShowSuccess(data, status) {
  var seriesId = $(data).find("Data Series id").text(),
      seriesName = $(data).find("Data Series SeriesName").text(),
      firstAiredDate = $(data).find("Data Series FirstAired").text(),
      overview = $(data).find("Data Series Overview").text(),
      bannersrc = bannerUrl + $(data).find("Data Series banner").text();  

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
  trackPageView("/addshowpage");

  stopspin("displayShowDetails"); 
}

/**
 * Success Callback for the Show Movie API
 * @param data the response data
 * @param status the status of the response
 */
function searchDisplayMovieSuccess(data, status) {
  var seriesId = $(data).find("Data Movie id").text(),
      seriesName = $(data).find("Data Movie title").text(),
      firstAiredDate = $(data).find("Data Movie releaseDate").text(),
      overview = $(data).find("Data Movie overview").text(),
      bannersrc = posterUrl + $(data).find("Data Movie posterPath").text();  

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
  trackPageView("/addmoviepage");

  stopspin("displayMovieDetails");
}

/**
 * Add a new show into the list of tracked shows.
 */
function addNewShow() {
	var seriesid = $("#addnewshowbutton").attr("data-seriesid");
	addShowToSeriesList(seriesid);
    $("#addshowpage").slideUp('slow');
    $("#mainpage").slideDown('slow');
    trackPageView("/index.html");
}

/**
 * Add a new show into the list of tracked shows and
 * adds the show into Facebook.
 */
function facebookAddNewShow() {
	var seriesid = $("#addnewshowbuttonfacebook").attr("data-seriesid"),
	    dataType = $("#addnewshowbuttonfacebook").attr("data-type"),
	    showUrl = facebookSeriesOgUrl + seriesid;

	if(dataType == "movie") {
	  showUrl = facebookMovieOgUrl + seriesid;
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
	  addNewShow();
      FB.api('/me/video.watches', 'post', { tv_show: showUrl }, function(response) {
  	    if (!response || response.error) {
          alert('Error occured: ' + JSON.stringify(response.error));
        } else {
          console.log('Post ID: ' + response.id);
        }
      });	
	}
		

	
}

/**
 * Builds the main screen from the localstorage cache.
 */
function buildMainScreenFromCache() {
    var start = new Date(),
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

    spin("buildMainScreenFromCache");
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
			  newEpisodeAirDate = parseDate(newEpisodeAirDateString);
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
	                    html("Season " + nextEpisodeCache[seriesId]["SeasonNumber"] + ", Episode " + nextEpisodeCache[seriesId]["EpisodeNumber"])).
	                  append(
	                    $("<span></span>").
	                    addClass("episodeFirstAired").
	                    html(nextEpisodeCache[seriesId]["FirstAired"])
	                    ).
	                  append(
	                    $("<div></div>").
	                    addClass("episodeSummary").
	                    html(nextEpisodeCache[seriesId]["Overview"])
	                    ).
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
	                      addClass("fa fa-info-circle"))
	                      
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
					$('#unwatchedShowList').children().each(function () {
					    if(!appended) {
							thisEpisodeAirDateString = $(this).find("span.episodeFirstAired").text();
							
							if(newEpisodeAirDateString < thisEpisodeAirDateString) {
								$(this).before(newEpisodeElement);
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
					$('#unairedShowList').children().each(function () {
					    if(!appended) {
							thisEpisodeAirDateString = $(this).find("span.episodeFirstAired").text();
							
							if(newEpisodeAirDateString < thisEpisodeAirDateString) {
								$(this).before(newEpisodeElement);
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
		$(".playedButton").click(playedEpisode);
		$(".facebookButton").click(facebookShare);
        $(".deleteButton").click(deleteSeriesButton);
        $(".pauseSeries").click(pauseSeriesButton)
        $("#deleteconfirm").click(deleteSeriesConfirm);
        $(".infoButtonShow").click(showInfoShow);
	}
    console.log("Build screen stop: " + ((new Date() - start)/1000));	  

	stopspin("buildMainScreenFromCache");
}

/**
 * Display confirmation dialog to delete the series from the tracked list
 *   referenced by this button.
 *
 * @this {element} the button id used (element.data-seriesid)
 */
function deleteSeriesButton() {
    var seriesid = $(this).attr("data-seriesid");
	$("#deleteconfirm").
	  attr("data-seriesid",seriesid);
	  
    $("#deletemodal").modal({minWidth:"300",maxWidth:"300"});
}

/**
 * Delete the series from the tracked list referenced by this button.
 * @this {element} the button id used (element.data-seriesid)
 */
function deleteSeriesConfirm() {
    var seriesid = $(this).attr("data-seriesid");
	deleteSeries(seriesid);
    $.modal.close();
}

/**
 * Puts a series on pause so that episodes will be placed into the paused list
 *
 * @this {element} the button id used (element.data-seriesid)
 */
function pauseSeriesButton() {
	var seriesid = $(this).attr("data-seriesid");
	
}


function showInfoShow() {
    var seriesid = $(this).attr("data-seriesid"),
        seriesUrl = getSeriesAllDetailsUrl + seriesid + "?includeall=true";

	spin("showInfoShow");
    $.ajax({
      url: seriesUrl,
      success: seriesDisplayShowSuccess,
      error: genericError
    });
}

function seriesDisplayShowSuccess(data, status) {
  var seriesId = $(data).find("Data Series id").text(),
      seriesName = $(data).find("Data Series SeriesName").text(),
      firstAiredDate = $(data).find("Data Series FirstAired").text(),
      overview = $(data).find("Data Series Overview").text(),
      bannersrc = bannerUrl + $(data).find("Data Series banner").text(),
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
  trackPageView("/showdetailspage");
  
  $(data).find("Data Episode").each(function(i) {
    episodeName = $(this).find("EpisodeName").text();
    seasonNumber = $(this).find("SeasonNumber").text(); 
    seasonid = $(this).find("seasonid").text();
    episodeNumber = $(this).find("EpisodeNumber").text();
    firstAired = $(this).find("FirstAired").text();
    watchedEpisodeKey = seriesId + "-" + $(this).find("id").text();
    episodeKeyString = seasonNumber + "x" + episodeNumber;
    episodeKey = parseInt(seasonNumber) * 100 + parseInt(episodeNumber);
    
    appendElement;
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
    watchedEpisodes = getWatchedEpisodes();
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

  $(".watchseason").click(watchSeason);
  $(".unwatchseason").click(unwatchSeason);
  $(".toggleWatched").click(toggleWatchShow);
  stopspin("showInfoShow");
}

function watchSeason() {
	var seasonid = $(this).attr("data-seasonid"),
	    watchedEpisodes = getWatchedEpisodes(),
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
		  addEpisodeToCloud(watchedEpisodeKey, watchedTime);
		  
		  $(this).find("i.toggleWatched").each(function(i) {
		    $(this).removeClass("fa fa-play-circle");
		    $(this).addClass("fa fa-eye-slash");
		  });
		}
	});
	
	if(dirty) {
		saveWatchedEpisodes(watchedEpisodes, true);
	}
}

/**
 * Triggered from the DOM - marks an entire season as unwatched by working
 * all of the child elements and pulling out the episode keys.
 *
 * @this {element} The dom element that holds the season
 */
function unwatchSeason() {
	var seasonid = $(this).attr("data-seasonid"),
	    dirty = false,
	    watchedEpisodes = getWatchedEpisodes(),
	    watchedEpisodeKey;
	    
	$( "div.episodelist[data-seasonid=" + seasonid + "]" ).each(function(i) {
		watchedEpisodeKey = $(this).attr("data-watchedkey");
		// console.log("Unwatched key: " + watchedEpisodeKey);
		if(watchedEpisodeKey in watchedEpisodes) {
		  dirty=true;
		  delete watchedEpisodes[watchedEpisodeKey];
		  
		  deleteEpisodeFromCloud(watchedEpisodeKey);
		  
		  $(this).find("i.toggleWatched").each(function(i) {
            // console.log("Toggle Eye key: " + watchedEpisodeKey);
		    $(this).removeClass("fa fa-eye-slash");
		    $(this).addClass("fa fa-play-circle");
		  });
		}
	});
	if(dirty) {
		saveWatchedEpisodes(watchedEpisodes, true);
	}
}

function toggleWatchShow() {
	var watchedkey = $(this).attr("data-watchedkey"),
	    watchedEpisodes;
	    
	if($(this).hasClass("fa fa-play-circle")) {
		$(this).removeClass("fa fa-play-circle");
		$(this).addClass("fa fa-eye-slash");

		// Tracking inside this method
		watchSingleEpisode(watchedkey, true);
	} else {
		watchedEpisodes = getWatchedEpisodes();
		$(this).removeClass("fa fa-eye-slash");
		$(this).addClass("fa fa-play-circle");
		delete watchedEpisodes[watchedkey];
		trackShowAction("Episode", "Delete", watchedkey);
		
		// TODO: Change Save Watched to False and just recache a single episode
		saveWatchedEpisodes(watchedEpisodes, true);
   	    
   	    // Delete realtime from Cloud
   	    deleteEpisodeFromCloud(watchedkey);		
	}
}

function facebookShare() {
	var seriesId = $(this).attr("data-seriesid"),
	    episodeId = $(this).attr("data-episodeId"),
	    seasonnumber = $(this).attr("data-seasonnumber"),
	    episodenumber = $(this).attr("data-episodenumber"),
	    seasonId = $(this).attr("data-seasonid");
	
	$("#facebookpost").
	  attr("data-seriesid",seriesId).
	  attr("data-episodeId",episodeId).
	  attr("data-seasonnumber",seasonnumber).
	  attr("data-episodenumber",episodenumber).
	  attr("data-seasonid",seasonId);
	
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			$("#facebookmodal").modal({minWidth:"300",maxWidth:"300"});
		} else {
			$("#mainpage").slideUp('slow');
			$("#settingspage").slideDown('slow');
			trackPageView("/settingspage");
		}
	});
}

function facebookPlayedEpisode() {
	var episodeId = $(this).attr("data-episodeId"),
	    seasonnumber = $(this).attr("data-seasonnumber"),
	    episodenumber = $(this).attr("data-episodenumber"),
	    seriesId = $(this).attr("data-seriesid"),
	    episodeKey = seriesId + "-" + episodeId,
	    showUrl = facebookSeriesOgUrl + seriesId + "/" + seasonnumber + "/" + episodenumber;
	    
	spin("facebookPlayedEpisode");
	removeSeriesFromNextEpisodeCache(seriesId);
	
	$.modal.close();
	
    FB.api('/me/video.watches', 'post', { tv_episode: showUrl }, function(response) {
	  if (!response || response.error) {
        alert('Error occured: ' + JSON.stringify(response.error));
      } else {
        console.log('Post ID: ' + response.id);
        watchSingleEpisode(episodeKey, true);        
      }
    });	
    stopspin("facebookPlayedEpisode");
}

function playedEpisode() {
	var seriesId = $(this).attr("data-seriesid"),
	    episodeId = $(this).attr("data-episodeId"),
	    episodeKey = seriesId + "-" + episodeId;

	removeSeriesFromNextEpisodeCache(seriesId);
    watchSingleEpisode(episodeKey, true);
}

/**
 * Adds a show to the series list locally and into the cloud systems.
 *
 * @param {string} seriesId the key for the series that is going to be tracked
 */
function addShowToSeriesList(seriesId) {
	var seriesList = getSeriesList(),
	    addTime = (new Date()).getTime();
	    
	seriesList[seriesId] = addTime;
	trackShowAction("Series", "Add", seriesId);
	addSeriesToCloud(seriesId, addTime);
	saveSeriesList(seriesList);
    checkPopupFloaters();
}

/**
 * Delete the series from the local storage and cloud.
 *
 * @param {string} seriesId the key of the series to be deleted
 */
function deleteSeries(seriesId) {
    // Treat as Map
	var seriesList = getSeriesList();
	delete seriesList[seriesId];
	trackShowAction("Series", "Delete", seriesId);
	saveSeriesList(seriesList);
    checkPopupFloaters();
    deleteSeriesFromCloud(seriesId);
}

function getSeriesList() {
    var result = {},
        seriesList = localStorage.getItem("seriesList"),
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
		  saveSeriesList(result);
		} else {
			result = tempResult;
		}
	}
	
	return result;
}

function getWatchedEpisodes() {
    var result = {},
        watchedEpisodes = localStorage.getItem("watchedEpisodes"),
        objectType;
        
	if(watchedEpisodes !== null) {
		result = JSON.parse(watchedEpisodes);
		objectType = Object.prototype.toString.call( result );
		// console.log("Watched Episodes type: " + objectType);
	}
	
	return result;
}

function saveSeriesList(seriesList) {
    var seriesListJson = JSON.stringify(seriesList),
        objectType = Object.prototype.toString.call( seriesList ),
        result = {};
        
	if(objectType  === '[object Array]') {
	  // console.log("Upgrading Series list to map");
	  for(var i=0; i<tempResult.length; i++) {
		  result[tempResult[i]] = (new Date()).getTime();
	  }
	  seriesListJson = JSON.stringify(result);
	}
	localStorage.setItem("seriesList", seriesListJson);
	recache();
}

function getSetting(settingKey) {
	var settingsJson = {};
	
    if(settings === undefined || settings === null) {
	  settingsJson = localStorage.getItem("settings");
	  if(settingsJson !== null) {      
		settings = JSON.parse(settingsJson);
	  } else {
		settings = {};
	  }
    }
    
    return settings[settingKey];
}

function setSetting(settingKey, settingValue) {
	var settingsJson = {};

    if(settings === undefined || settings === null) {
	  settingsJson = localStorage.getItem("settings");
	  if(settingsJson !== null) {      
		settings = JSON.parse(settingsJson);
	  } else {
		settings = {};
	  }
    }
    
	settings[settingKey] = settingValue;
	localStorage.setItem("settings", JSON.stringify(settings));
}

/**
 * Adds a single watch key into the local store and the cloud.
 *
 * @param {string} watchedEpisodeKey the key of the episode to mark as watched
 *        in the format of "{seriesId}-{episodeId}"
 * @param {boolean} requestRecache indicates if the system should
 *        automatically recache the system after adding the episode
 */
function watchSingleEpisode(watchedEpisodeKey, requestRecache) {
    var watchedEpisodes = getWatchedEpisodes(),
        watchedTime = (new Date()).getTime();
        
	watchedEpisodes[watchedEpisodeKey] = watchedTime;
	trackShowAction("Episode", "Add", watchedEpisodeKey);

	// Realtime Add to Cloud
    addEpisodeToCloud(watchedEpisodeKey, watchedTime);
    saveWatchedEpisodes(watchedEpisodes, requestRecache);
}

/**
 * Removes a series from the Next Episode Cache so that it can quickly vanish
 * from display.  This series will come back as soon as it is recached.
 *
 * @param {string} seriesId the id of the series to remove.
 */
function removeSeriesFromNextEpisodeCache(seriesId) {
	var nextEpisodeCacheJson = localStorage.getItem("nextEpisodeCache"),
	    nextEpisodeCache = JSON.parse(nextEpisodeCacheJson);
	    
	delete nextEpisodeCache[seriesId];
	localStorage.setItem("nextEpisodeCache",JSON.stringify(nextEpisodeCache));
	
	// Mark the episode as played:
	if($("div#series-"+seriesId)) {
		$("div#series-"+seriesId).addClass("played");
	}
	
	// buildMainScreenFromCache();
}

/**
 * Saves the watched episode list into the localstorage object
 *
 * @param {Array.Object} watchedEpisodes is a array of watched episode objects
 * @param {boolean} requestRecache says whether this update should also
 *        trigger a full recache.
 */
function saveWatchedEpisodes(watchedEpisodes, requestRecache) {
	var watchedEpisodesJson = JSON.stringify(watchedEpisodes);
	localStorage.setItem("watchedEpisodes", watchedEpisodesJson);
	if(requestRecache == true) {
		recache();
	}
}


function genericError(jqXHR, textStatus) {
    stopspin("genericError");
	alert("Failure: textStatus = [" + textStatus + "], jqXHR.response [" + JSON.stringify(jqXHR.response) + "]");
	console.log("Failure: textStatus = [" + textStatus + "], jqXHR.response [" + JSON.stringify(jqXHR.response) + "]");
}


/**
 * Does a realtime add of a watched key into the cloud stores if they are
 * authenticated.
 *
 * @param {string} watchedEpisodeKey Provides the key to the episode that
 *        has been watched.  They key is in the format of
 *        "{seriesId}-{episodeId}"
 * @param {number} watchedTime an epoch indicator of when the show was watched
 */
function addEpisodeToCloud(watchedEpisodeKey, watchedTime) {
	var now = (new Date()).getTime(),
	    results;
	// If the Dropbox Table Exists add to it
	if(watchedEpisodesTable) {
		results = watchedEpisodesTable.query({"watchedEpisodeKey": watchedEpisodeKey});
		if(results === null || results.length === 0) {
			watchedEpisodesTable.insert({"episodeKey": watchedEpisodeKey, "updated": now});
		}
	}
	
	// If Google is Auth'ed add to it:
	if(googleAuth) {
		$.ajax({
			url: googleRootUrl+"/data/watched",
			type: "POST",
			data: { "watchedKey": watchedEpisodeKey, "updated": now },
			error: genericError
	    });
	}	
}

/**
 * Does a realtime add of a series into the cloud stores if they are
 * authenticated.
 *
 * @param {string} seriesKey Provides the key to the series that should
 *        be tracked
 * @param {number} watchedTime an epoch indicator of when the show was watched
 */
function addSeriesToCloud(seriesKey, watchedTime) {
	var now = (new Date()).getTime(),
	    results;
	
	// If the Dropbox Table Exists add to it
	if(seriesListTable) {
		results = seriesListTable.query({"seriesId": seriesKey});
		if(results === null || results.length === 0) {
			seriesListTable.insert({"seriesId": seriesKey, "updated": now});
		}
	}
	
	// If Google is Auth'ed add to it:
	if(googleAuth) {
		$.ajax({
			url: googleRootUrl+"/data/series",
			type: "POST",
			data: { "seriesId": seriesKey, "updated": now },
			error: genericError
		});
	}	
}

/**
 * Does a realtime delete of a watched key from the cloud stores if they are
 * authenticated.
 *
 * @param {string} watchedEpisodeKey Provides the key to the episode that
 *        has been watched. The key is in the format of
 *        "{seriesId}-{episodeId}"
 */
function deleteEpisodeFromCloud(watchedEpisodeKey) {
	var results,
	    i;
	
	// Delete realtime from Dropbox
	if(watchedEpisodesTable) {
		results = watchedEpisodesTable.query({"episodeKey": watchedEpisodeKey}); 
		for(i=0; i< results.length; i++) {
			results[i].deleteRecord();
		}			  
	}
	
	// Delete realtime from Google
	if(googleAuth) {
		$.ajax({
			url: googleRootUrl+"/data/watched/"+watchedEpisodeKey,
			type: "DELETE",
			error: genericError
		});
	}	
}

/**
 * Does a realtime delete of a series from the cloud stores if they are
 * authenticated.
 *
 * @param {string} seriesId the key of the series to remove
 */
function deleteSeriesFromCloud(seriesId) {
	var results,
	    i;
	
	if(seriesListTable) {
		results = seriesListTable.query({"seriesId": seriesId}); 
		for(i=0; i< results.length; i++) {
			results[i].deleteRecord();
		}
	}

	if(googleAuth) {
		$.ajax({
			url: googleRootUrl+"/data/series/"+seriesId,
			type: "DELETE",
			error: genericError
		});
	}
}

/** Dropbox Sync State Stuff **/
var isDropboxSyncing = false,
    syncKeyArray,
    dropboxTableResult,
    syncKeyIndex,
    watchedEpisodesSync,
    seriesListSync,
    localDirty,
    dropBoxSyncStart = new Date();

function syncDropbox() {
    if(!isDropboxSyncing && client.isAuthenticated()) {
	  spin("syncDropbox");
	  trackSyncService("Dropbox","Sync Start");
	  dropBoxSyncStart = new Date();
      console.log("Starting Dropbox Sync: " + dropBoxSyncStart.toLocaleString());
      isDropboxSyncing = true;
  	  watchedEpisodesSync = getWatchedEpisodes();
	  seriesListSync = getSeriesList();
	  localDirty = false;
      
      // Setup to Sync Watched Episodes From Dropbox
      dropboxTableResult = watchedEpisodesTable.query();
      syncKeyIndex = 0;
      setTimeout(syncWatchedEpisodesFromDropbox,timeoutDelay);

    }
}

function syncWatchedEpisodesFromDropbox() {
	if(syncKeyIndex < dropboxTableResult.length) {
		var episodeKey = dropboxTableResult[syncKeyIndex].get("episodeKey"),
		    dropboxUpdated = dropboxTableResult[syncKeyIndex].get("updated");
		if(dropboxUpdated == null) {
			console.log("No updated time in dropbox, updated for " + episodeKey + ": " + ((new Date() - dropBoxSyncStart)/1000));
			dropboxUpdated = 0;
			dropboxTableResult[syncKeyIndex].set("updated",dropboxUpdated);
			console.log("Dropbox updated done for " + episodeKey + ": " + ((new Date() - dropBoxSyncStart)/1000));
		}
		
		if(episodeKey !== null && !(episodeKey in watchedEpisodesSync)) {
			console.log("Added local key " + episodeKey + ": " + ((new Date() - dropBoxSyncStart)/1000));
			watchedEpisodesSync[episodeKey] = (new Date()).getTime();
			localDirty = true;
		}
		syncKeyIndex++;
		setTimeout(syncWatchedEpisodesFromDropbox,timeoutDelay);
	} else {
      console.log("All done syncing episodes from dropbox." + ((new Date() - dropBoxSyncStart)/1000));
      
      // Setup to Sync Series from Dropbox
      dropboxTableResult = seriesListTable.query();
      syncKeyIndex = 0;
      setTimeout(syncSeriesFromDropbox,timeoutDelay);
	}
}

function syncSeriesFromDropbox() {
	if(syncKeyIndex < dropboxTableResult.length) {
		var seriesId = dropboxTableResult[syncKeyIndex].get("seriesId"),
		    dropboxUpdated = dropboxTableResult[syncKeyIndex].get("updated");
		    
		if(dropboxUpdated == null) {
			dropboxUpdated = 0;
			dropboxTableResult[syncKeyIndex].set("updated",dropboxUpdated);
		}

		if(seriesId !== null && !(seriesId in seriesListSync)) {
			seriesListSync[seriesId] = (new Date()).getTime();
			localDirty = true;
		}
		syncKeyIndex++;
		setTimeout(syncSeriesFromDropbox,timeoutDelay);
	} else {
      console.log("All done syncing series from dropbox." + ((new Date() - dropBoxSyncStart)/1000));
		if(localDirty === true) {
			console.log("Local is dirty, so recache." + ((new Date() - dropBoxSyncStart)/1000));
			saveWatchedEpisodes(watchedEpisodesSync, false); // don't recache
			saveSeriesList(seriesListSync);
			localDirty = false;
			recache();
		}

	  // Setup to Sync Watched Episodes to Dropbox
	  syncKeyArray = Object.keys(watchedEpisodesSync);
	  syncKeyIndex = 0;
	  setTimeout(syncWatchedEpisodesToDropbox,slowTimeoutDelay);      
   	}
}

function syncWatchedEpisodesToDropbox() {  
  if(syncKeyIndex < syncKeyArray.length) {
	  var episodeKey = syncKeyArray[syncKeyIndex++],
	      results = watchedEpisodesTable.query({"episodeKey": episodeKey}),
	      episodeValue;
	      
	  if(results === null || results.length === 0) {
	      episodeValue = watchedEpisodesSync[episodeKey];
	      if(episodeValue == null) {
		      episodeValue = 0;
		      watchedEpisodesSync[episodeKey] = episodeValue;
		      localDirty = true;
	      }
	      watchedEpisodesTable.insert({"episodeKey": episodeKey, "updated": (new Date()).getTime()});
	  }	  
	  setTimeout(syncWatchedEpisodesToDropbox,slowTimeoutDelay);
  } else {
      console.log("All done syncing episodes to Dropbox." + ((new Date() - dropBoxSyncStart)/1000));
      
      // Set to Sync Series to Dropbox
      syncKeyArray = Object.keys(getSeriesList());
      syncKeyIndex = 0;
      setTimeout(syncSeriesToDropbox, slowTimeoutDelay);
  }
}

function syncSeriesToDropbox() {
  if(syncKeyIndex < syncKeyArray.length) {
	  var seriesKey = syncKeyArray[syncKeyIndex++],
	      results = seriesListTable.query({"seriesId": seriesKey}),
	      seriesValue;
	      
	  if(results === null || results.length === 0) {
	        seriesValue = seriesListSync[seriesKey];
			if(seriesValue == null) {
				seriesValue = 0;
				seriesListSync[seriesKey] = seriesValue;
				localDirty = true;
			}
	        seriesListTable.insert({"seriesId": seriesKey, "updated": (new Date()).getTime()});
	  }
	  setTimeout(syncSeriesToDropbox,slowTimeoutDelay);
  } else {
      console.log("All done syncing series." + ((new Date() - dropBoxSyncStart)/1000));
      setTimeout(syncDropboxComplete,slowTimeoutDelay);
  }
}

function syncDropboxComplete() {
	var lastDropboxSync = new Date();
	localStorage.setItem("lastDropboxSync",lastDropboxSync.getTime());
	updateSyncDisplay();
    stopspin("syncDropbox");
    checkPopupFloaters();
    trackSyncComplete("Dropbox","Sync Complete","Time",((new Date() - dropBoxSyncStart)/1000));
	isDropboxSyncing = false;
    console.log("Dropbox sync marked complete." + ((new Date() - dropBoxSyncStart)/1000));
}


/** Google Sync State Stuff **/
var isGoogleSyncing = false,
    googleSyncKeyArray,
    googleArrayResult,
    googleArrayIndex,
    googleWatchedEpisodesSync,
    googleSeriesListSync,
    googleLocalDirty,
    googleSyncStart = new Date(),
    googleLastSyncTime = 0;

function syncGoogle() {
    if(!isGoogleSyncing && googleAuth) {
	  spin("syncGoogle");
	  trackSyncService("Google","Sync Start");
	  googleSyncStart = new Date();
	  if(localStorage.getItem("lastGoogleSync") != null) {
		  googleLastSyncTime = localStorage.getItem("lastGoogleSync");
	  }

      console.log("Starting Google Sync: " + googleSyncStart.toLocaleString());
      isGoogleSyncing = true;
      googleWatchedEpisodesSync = getWatchedEpisodes();
      googleSeriesListSync = getSeriesList();
      googleLocalDirty = false;
      googleArrayResult = [];
      googleArrayIndex = 0;
      
      // Setup to Sync Watched Episodes From Google
      $.ajax({
          url: googleRootUrl+"/data/watched?updated="+googleLastSyncTime,
          success: function(data, status) {
        	  googleArrayResult = data;
        	  googleArrayIndex = 0;
        	  console.log("Got watched episodes from Google: " + ((new Date() - googleSyncStart)/1000));
          },
          complete: function(jqXHR,textStatus) {
        	  setTimeout(syncWatchedEpisodesFromGoogle,timeoutDelay);
          },
          error: genericError
        });
    }
}

function syncWatchedEpisodesFromGoogle() {
	if(googleArrayIndex < googleArrayResult.length) {
		var episodeKey = googleArrayResult[googleArrayIndex].watchedKey,
		    googleUpdated = googleArrayResult[googleArrayIndex].updated;
		if(googleUpdated == null) {
			googleUpdated = 0;
			googleArrayResult[googleArrayIndex].updated = googleUpdated;
		}
		
		if(episodeKey !== null && !(episodeKey in googleWatchedEpisodesSync)) {
			console.log("Added local key " + episodeKey + ": " + ((new Date() - googleSyncStart)/1000));
			googleWatchedEpisodesSync[episodeKey] = (new Date()).getTime();
			googleLocalDirty = true;
		}
		googleArrayIndex++;
		setTimeout(syncWatchedEpisodesFromGoogle,timeoutDelay);
	} else {
      console.log("All done syncing episodes from Google. " + ((new Date() - googleSyncStart)/1000));
      
      if(googleLocalDirty) {
	      // Done with local sync
	      console.log("Local is dirty, so recache." + ((new Date() - dropBoxSyncStart)/1000));
		  saveWatchedEpisodes(googleWatchedEpisodesSync, false); // don't recache
		  saveSeriesList(googleSeriesListSync);
          googleLocalDirty = false;
          recache();
      }
      
      // Setup to Sync Series Google
      googleArrayResult = [];
      googleArrayIndex = 0;
      // Setup to Sync Watched Episodes From Google
      $.ajax({
          url: googleRootUrl+"/data/series?updated="+googleLastSyncTime,
          success: function(data, status) {
        	  googleArrayResult = data;
        	  googleArrayIndex = 0;
        	  console.log("Got series from Google: " + ((new Date() - googleSyncStart)/1000));
          },
          complete: function(jqXHR,textStatus) {
        	  setTimeout(syncSeriesFromGoogle,timeoutDelay);
          },
          error: genericError
        });
	}
}

function syncSeriesFromGoogle() {
	if(googleArrayIndex < googleArrayResult.length) {
		var seriesId = googleArrayResult[googleArrayIndex].seriesId,
		    googleUpdated = googleArrayResult[googleArrayIndex].updated;
		if(googleUpdated == null) {
			googleUpdated = 0;
			googleArrayResult[googleArrayIndex].updated = googleUpdated;
		}

		if(seriesId !== null && !(seriesId in googleSeriesListSync)) {
			googleSeriesListSync[seriesId] = (new Date()).getTime();
			googleLocalDirty = true;
		}
		googleArrayIndex++;
		setTimeout(syncSeriesFromGoogle,timeoutDelay);
	} else {
      console.log("All done syncing series from Google. " + ((new Date() - googleSyncStart)/1000));
      if(googleLocalDirty) {
	      // Done with local sync
	      console.log("Local is dirty, so recache." + ((new Date() - googleSyncStart)/1000));
		  saveWatchedEpisodes(googleWatchedEpisodesSync, false); // don't recache
		  saveSeriesList(googleSeriesListSync);
          googleLocalDirty = false;
          recache();
      }

      // Setup to Sync Watched Episode To Google
      googleArrayResult = Object.keys(googleWatchedEpisodesSync);
      googleArrayIndex = 0;
	  setTimeout(syncWatchedEpisodesToGoogle,slowTimeoutDelay);      
   	}
}

function syncWatchedEpisodesToGoogle() {  
	  if(googleArrayIndex < googleArrayResult.length) {
		  var episodeKey = googleArrayResult[googleArrayIndex++],
		      episodeValue = googleWatchedEpisodesSync[episodeKey];
		  googleArrayIndex++;
		  
		  if(episodeValue >= googleLastSyncTime) {
			  $.ajax({
			          url: googleRootUrl+"/data/watched",
			          type: "POST",
			          data: { "watchedKey": episodeKey, "updated": (new Date()).getTime() },
			          error: genericError,
			          complete: function(jqXHR,textStatus) {
			        	  setTimeout(syncWatchedEpisodesToGoogle,timeoutDelay);
			          }
			        });
		  } else {
        	  setTimeout(syncWatchedEpisodesToGoogle,timeoutDelay);			  
		  }
	  } else {
	      console.log("All done syncing episodes to Google. " + ((new Date() - googleSyncStart)/1000));
	      
	      // Set to Sync Series to Google
	      googleArrayResult = Object.keys(googleSeriesListSync);
	      googleArrayIndex = 0;
	      setTimeout(syncSeriesToGoogle, slowTimeoutDelay);
	  }
}

function syncSeriesToGoogle() {
	  if(googleArrayIndex < googleArrayResult.length) {
		  var seriesKey = googleArrayResult[googleArrayIndex++],
		      seriesValue = googleSeriesListSync[seriesKey];
          if(seriesValue == null) {
		      seriesValue = 0;
		      googleSeriesListSync[seriesKey] = seriesValue;
			  googleLocalDirty = true;
		  }

		  if(seriesValue >= googleLastSyncTime) {          
			  $.ajax({
		          url: googleRootUrl+"/data/series",
		          type: "POST",
		          data: { "seriesId": seriesKey, "updated": (new Date()).getTime() },
		          error: genericError,
		          complete: function(jqXHR,textStatus) {
		        	  setTimeout(syncSeriesToGoogle,timeoutDelay);
		          }	          
		        });
		  } else {
			  setTimeout(syncSeriesToGoogle,timeoutDelay);
		  }
	  } else {
	      console.log("All done syncing series to Google. " + ((new Date() - googleSyncStart)/1000));
	      setTimeout(syncGoogleComplete,slowTimeoutDelay);
	  }
}

function syncGoogleComplete() {
	var lastGoogleSync = new Date();
	localStorage.setItem("lastGoogleSync",lastGoogleSync.getTime());
	updateSyncDisplay();
    stopspin("syncGoogle");
    checkPopupFloaters();
    trackSyncComplete("Google","Sync Complete","Time",((new Date() - googleSyncStart)/1000));
    isGoogleSyncing = false;
    console.log("Google sync marked complete. " + ((new Date() - googleSyncStart)/1000));
}
/** End of the Sync Google Code **/


// Start the Recache
var isRecaching = false,
    seriesListRecache,
    seriesListIndex,
    nextEpisodeCache = {},
    seriesListCache = {},
    recacheStart = new Date();
    
function recache() {
    if(!isRecaching) {
	    spin("recache");
        isRecaching = true;
    	trackSyncService("TheTVDB","Sync Start");
        recacheStart = new Date();
        console.log("Starting recache. " + ((new Date() - recacheStart)/1000));
		seriesListRecache = Object.keys(getSeriesList());
		nextEpisodeCache = {};
		seriesListCache = {};
		seriesListIndex = 0;
	    setTimeout(recacheSeries, timeoutDelay);
    }
}

function recacheSeries() {
	var lastTheTvDbSync,
	    seriesListItem,
	    searchUrl;
	
	if(seriesListIndex  < seriesListRecache.length) {
		seriesListItem = seriesListRecache[seriesListIndex++];
		searchUrl = getSeriesAllDetailsUrl + seriesListItem + "?includeall=false";
		
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
			  
			  newSeries["bannersrc"] = bannerUrl + $(data).find("Data Series banner").text();
			  seriesListCache[seriesId] = newSeries;
		      
		      $(data).find("Data Episode").each(function(i) {
		          var episodeId = $(this).find("id").text(),
		              episodeKey = seriesId + "-" + episodeId,
		              firstAired,
		              firstAiredDate,
		              firstAiredEpoch;
		              
		          if(!(episodeKey in getWatchedEpisodes())) {
					  firstAired = $(this).find("FirstAired").text();
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
							  oldestUnwatchedEpisode["seriesName"] = newSeries["seriesName"];
							  oldestUnwatchedEpisode["EpisodeName"] = $(this).find("EpisodeName").text();
							  oldestUnwatchedEpisode["EpisodeNumber"] = $(this).find("EpisodeNumber").text();
							  oldestUnwatchedEpisode["SeasonNumber"] = $(this).find("SeasonNumber").text();
							  oldestUnwatchedEpisode["bannersrc"] = newSeries["bannersrc"];
							  oldestUnwatchedEpisode["EpisodeImage"] = bannerUrl+ $(this).find("filename").text();
							  oldestUnwatchedEpisode["Overview"] = $(this).find("Overview").text();
							  if( oldestUnwatchedEpisode["Overview"].length > 200 ) {
								  oldestUnwatchedEpisode["Overview"] = oldestUnwatchedEpisode["Overview"].substr(0,200) + "...";
							  }

							  // console.log(oldestUnwatchedEpisode["EpisodeName"] + ", Season: " + oldestUnwatchedEpisode["SeasonNumber"] + ", Episode: " + oldestUnwatchedEpisode["EpisodeNumber"]);
						  }
					  }
		          }
			  });
			  if(oldestUnwatchedEpisode !== null) {
				  nextEpisodeCache[seriesId] = oldestUnwatchedEpisode;
			  }
		  }});
		  setTimeout(recacheSeries, timeoutDelay);
	} else {
		localStorage.setItem("nextEpisodeCache",JSON.stringify(nextEpisodeCache));
		localStorage.setItem("seriesListCache",JSON.stringify(seriesListCache));
		buildMainScreenFromCache();
	
		lastTheTvDbSync = new Date();
		localStorage.setItem("lastTvDbSync",lastTheTvDbSync.getTime());
		updateSyncDisplay();
		stopspin("recache");		
	    trackSyncComplete("TheTVDB","Sync Complete","Time",((new Date() - recacheStart)/1000));
		isRecaching = false;
        console.log("Finished recache. " + ((new Date() - recacheStart)/1000));
	}	
}

/*
 * Deletes an element out of local storage
 */
function resetLocalStorage() {
	localStorageName = $(this).attr("data-storagename");
	localStorage.removeItem(localStorageName);
	updateSyncDisplay();
}

function parseDate(input) {
  var parts = input.split('-');
  // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
  return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
}

/** START: Google Analytics */
/**
 * Tracks a page view event.
 * @param {string} pagename the name of the page to be tracked.
 */
function trackPageView(pagename) {
    var g = window._gaq || (window._gaq = []);
    
 	g.push(['_setAccount', googleAnalyticsAccount]);
    g.push(['_trackPageview', pagename]);
}

/**
 * Tracks an action against a sync service
 * @param {string} serviceName the name of the service being synced
 * @param {string} action the action of the syncronization
 */
function trackSyncService(serviceName, action) {
    var g = window._gaq || (window._gaq = []);
    
 	g.push(['_setAccount', googleAnalyticsAccount]);
    g.push(['_trackEvent', serviceName, action]);
}

/**
 * Tracks the completion of syncronization
 * @param {string} serviceName the name of the service being synced
 * @param {string} action the action of the syncronization
 * @param {string} label the completion action (e.g. Time)
 * @param {number} value the value, typically the amount of milliseconds to sync
 */
function trackSyncComplete(serviceName, action, label, value) {
    var g = window._gaq || (window._gaq = []);
    
 	g.push(['_setAccount', googleAnalyticsAccount]);
    g.push(['_trackEvent', serviceName, action, label, value]);
}

/**
 * Tracks the action against a show
 * @param {string} category either "Series" or "Episode"
 * @param {string} action the action taken to the series or episode
 * @param {string} label the label for the action - which series or episode
 */
function trackShowAction(category, action, label) {
    var g = window._gaq || (window._gaq = []);
    
 	g.push(['_setAccount', googleAnalyticsAccount]);
    g.push(['_trackEvent', category, action, label]);
}
/** END: Google Analytics */


/** START: Facebook Integration */
window.fbAsyncInit = function() {
	FB.init({
		appId      : '132823190241236', // App ID
		channelUrl : '//thewirewatcher.appspot.com/channel.html', // Channel File
		status     : true, // check login status
		cookie     : true, // enable cookies to allow the server to access the session
		xfbml      : true  // parse XFBML
	});
};
// Load the SDK asynchronously
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));
/** END: Facebook Integration */