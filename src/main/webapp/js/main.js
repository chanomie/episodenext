/**
 Copyright 2013 Jordan Reed

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
   
   http://code.google.com/p/thewirewatcher/
**/

// Insert your Dropbox app key here:
var DROPBOX_APP_KEY = 'daywyfneqb6yg8i';

// Exposed for easy access in the browser console.
var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
var seriesListTable;
var watchedEpisodesTable;

var TheTbDbUrlBase = "http://thetvdb.com";
var getSeriesUrl = "https://thewirewatcher.appspot.com/api/getseries?seriesname=";
var getSeriesDetailsUrl = "https://thewirewatcher.appspot.com/api/"
var getSeriesAllDetailsUrl = "https://thewirewatcher.appspot.com/api/all/"
var facebookOgUrl = "https://thewirewatcher.appspot.com/showdetails/";
var spinCount = 0;
var settings;


$(document).ready(function() {
  spin();
  $("#addshowbutton").click(function() {
    $("#mainpage").slideUp('slow');
    $("#searchpage").slideDown('slow');
    $("#searchtext").focus();

  });

  $("#cancelsearch").click(function() {
    $("#mainpage").slideDown('slow');
    $("#searchpage").slideUp('slow');
  });
  
  $("#canceladdshowpage").click(function() {
	$("#searchpage").slideDown('slow');  
	$("#addshowpage").slideUp('slow');
  });
  
  $("#settingsbutton").click(function() {
    updateSyncDisplay();  
    $("#mainpage").slideUp('slow');
    $("#settingspage").slideDown('slow');
  });

  $("#settingsdone").click(function() {
    $("#settingspage").slideUp('slow');
    $("#mainpage").slideDown('slow');	  
  });
  
  $("#showdetailsdone").click(function() {
    $("#showdetailspage").slideUp('slow');
    $("#mainpage").slideDown('slow');	  
  });

  $("#showaboutthetvdb").click(function(){
    $("#settingspage").slideUp('slow');
    $("#aboutthetvdb").slideDown('slow');	  	  
  });
  
  $("#aboutthetvdbback").click(function(){
    $("#aboutthetvdb").slideUp('slow');
    $("#settingspage").slideDown('slow');	  	  
  });
  
  $("#allshowsseasonbar").click(function() {
	 if($(this).attr("data-status") == "hidden") {
	   	$(this).attr("data-status","shown");
	   	$("#allshowsexpander").removeClass("icon-expand");
	   	$("#allshowsexpander").addClass("icon-collapse");
	   	$("#showlist").show();
		$(document.body).animate({
		    'scrollTop': $('#allshowsseasonbar').offset().top
		}, 1000);	   	
	} else {
	   	$(this).attr("data-status","hidden");
	   	$("#allshowsexpander").removeClass("icon-collapse");
	   	$("#allshowsexpander").addClass("icon-expand");
	   	$("#showlist").hide();
	 }
  });

  $("#unairedseasonbar").click(function() {
	 if($(this).attr("data-status") == "hidden") {
	   	$(this).attr("data-status","shown");
	   	$("#unairedseasonexpander").removeClass("icon-expand");
	   	$("#unairedseasonexpander").addClass("icon-collapse");
	   	$("#unairedShowList").show();
		$(document.body).animate({
		    'scrollTop': $('#unairedseasonbar').offset().top
		}, 1000);	   	
	} else {
	   	$(this).attr("data-status","hidden");
	   	$("#unairedseasonexpander").removeClass("icon-collapse");
	   	$("#unairedseasonexpander").addClass("icon-expand");
	   	$("#unairedShowList").hide();
	 }
  });

    
  $("#addnewshowbutton").click(addNewShow);
  $('#addshowform').submit(onSearch);
  $("#recache").click(recache);
  $("#facebookcancel").click(function() {$.modal.close()});
  $("#facebookpost").click(facebookPlayedEpisode);
  $("#addtohome .close").click(function() {
	$("#addtohome").slideUp('slow');
	localStorage.setItem("hideaddto","true");
  });
  
  $("#dropboxSyncButton").click(syncDropbox);
  $('#dropboxLoginButton').click(function (e) {
    e.preventDefault();
    client.authenticate();
  });
  $('#dropboxLogoutButton').click(logoutDropbox);
  $("#thetvdbsync").click(recache);
  $("#dropboxsync").change(changeSyncFrequency);
  $("#tvdbsync").change(changeSyncFrequency);

  client.authenticate({interactive:false}, function (error) {
	if (error) {
		alert('Authentication error: ' + error);
    }
  });

	if (client.isAuthenticated()) {
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
			setTimeout(checkAndSync,3000);

			// Ensure that future changes update the list.
			// datastore.recordsChanged.addListener(updateList);
		});
	}
  
  checkPopupFloaters();
  updateSyncDisplay();
  buildMainScreenFromCache();
  stopspin();
});

function checkPopupFloaters() {
  if(getSeriesList()==null || getSeriesList().length == 0) {
	  $(".help").show();
  } else {
	  $(".help").hide();
	  if(localStorage.getItem("hideaddto") == null 
	      && window
	      && window.navigator
	      && window.navigator.standalone == false) {
	      
		$("#addtohome").slideDown('slow');	  
	  }
  }

}

function updateSyncDisplay() {
   var today = new Date();
   var lastDropboxSyncEpoch = localStorage.getItem("lastDropboxSync");
   if(lastDropboxSyncEpoch != null) {
	   lastDropboxSync = new Date(parseInt(lastDropboxSyncEpoch));
	   
	   if(today.toDateString() == lastDropboxSync.toDateString()) {
	       $("#dropboxsynctime").text(lastDropboxSync.toLocaleTimeString());
       } else {
	       $("#dropboxsynctime").text(lastDropboxSync.toLocaleDateString());	       
       }
   }
   var dropboxFrequencySetting = getSetting("dropbox.frequency");
   if(dropboxFrequencySetting !== undefined && dropboxFrequencySetting !== null) {
	   $("#dropboxsync").val(dropboxFrequencySetting);
   }

   var lastTheTvDbSyncEpoch = localStorage.getItem("lastTvDbSync");
   if(lastTheTvDbSyncEpoch != null) {
	   lastTheTvDbSync = new Date(parseInt(lastTheTvDbSyncEpoch));
	   
	   if(today.toDateString() == lastTheTvDbSync.toDateString()) {
	       $("#thetvdbsynctime").text(lastTheTvDbSync.toLocaleTimeString());
       } else {
	       $("#thetvdbsynctime").text(lastTheTvDbSync.toLocaleDateString());	       
       }
   }
   var thetvdbFrequencySetting = getSetting("thetvdb.frequency");
   if(thetvdbFrequencySetting !== undefined && thetvdbFrequencySetting !== null) {
	   $("#tvdbsync").val(thetvdbFrequencySetting);
   }
   
   
   
}

function changeSyncFrequency() {
	var syncKey = $(this).attr("data-sync");
	var frequency = $(this).val();
	
    setSetting(syncKey, frequency);
}

function logoutDropbox() {
	if (client.isAuthenticated()) {
	  client.signOut(function(){
		$("#dropboxlogout").hide();		  
		$('#dropboxlogin').show();
	  });
	}
}

function checkAndSync() {
	var dropboxFrequencyString = getSetting("dropbox.frequency");
	var thetvdbFrequencyString = getSetting("thetvdb.frequency");
	var now = new Date();
		
    if(dropboxFrequencyString !== undefined && dropboxFrequencyString !== null && dropboxFrequencyString !== "0") {
	    var lastDropboxSyncEpoch = localStorage.getItem("lastDropboxSync");
	    if(lastDropboxSyncEpoch == null) {
	      lastDropboxSyncEpoch = 0;
	    }
        var dropboxFrequency = parseInt(dropboxFrequencyString);
	    lastDropboxSync = new Date(parseInt(lastDropboxSyncEpoch));
		var difference = now - lastDropboxSync;             
		difference = difference / 60 / 1000;         
         if(difference > dropboxFrequency) {
	         syncDropbox();
         }

    }	

    if(thetvdbFrequencyString !== undefined && thetvdbFrequencyString !== null && thetvdbFrequencyString !== "0") {
	    var lastTheTvDbSyncEpoch = localStorage.getItem("lastTvDbSync");
    	console.log("lastTvDbSync = " + lastTheTvDbSyncEpoch);
	    if(lastTheTvDbSyncEpoch == null) {
	      lastTheTvDbSyncEpoch = 0
	    }
        var thetvdbFrequency = parseInt(thetvdbFrequencyString);
	    lastTheTvDbSync = new Date(parseInt(lastTheTvDbSyncEpoch));
		var difference = now - lastTheTvDbSync;             
		difference = difference / 60 / 1000;
         
         if(difference > thetvdbFrequency) {
	         recache();
         }
    }	

}

function spin() {
  spinCount++;
  $("#spinner").show();
  $("#spinner").spin();	
}

function stopspin() {
  spinCount--;
  if(spinCount <= 0) {
    spinCount = 0;
    $("#spinner").hide();
    $("#spinner").spin(false);
  }
}

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

function searchForShow(showname) {
    var encodedName = encodeURIComponent(showname);
    var searchUrl = getSeriesUrl + encodedName;
    
    spin();
    $.ajax({
      url: searchUrl,
      success: searchForShowSuccess,
      error: genericError
    });
}

function searchForShowSuccess(data, status) {
	$(data).find("Series").each(function(i) {
		var seriesId = $(this).find("seriesid").text();
		var seriesName = $(this).find("SeriesName").text();
		var firstAired = $(this).find("FirstAired").text();
		if(firstAired === null || firstAired === "") {
			firstAired = "unknown";
		}
		
		var newSeries = $("<div></div>").
			attr({ "data-seriesid" : seriesId }).
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
				  addClass("icon-chevron-right")
				)
			);
			
			
         $("#searchResultList").append(newSeries);	
	});
	
	$(".seriesrow").click(displayShowDetails);
    stopspin();
}

function displayShowDetails() {
    var seriesid = $(this).attr("data-seriesid");
    console.log("Getting show detail: " + seriesid);
    var searchUrl = getSeriesDetailsUrl + seriesid;

	spin();
    $.ajax({
      url: searchUrl,
      success: searchDisplayShowSuccess,
      error: genericError
    });
}

function searchDisplayShowSuccess(data, status) {
  var seriesId = $(data).find("Data Series id").text();
  var seriesName = $(data).find("Data Series SeriesName").text();
  var firstAiredDate = $(data).find("Data Series FirstAired").text(); 
  var overview = $(data).find("Data Series Overview").text(); 
  var bannersrc = TheTbDbUrlBase + "/banners/" + $(data).find("Data Series banner").text();  
  console.log("Updating image show detail: " + seriesName);

  $("#addbannerimage").attr("src",bannersrc);
  $("#addshowtitle").html(seriesName);
  $("#addfirstaired").html(firstAiredDate);
  $("#addoverview").html(overview);
  $("#addnewshowbutton").attr("data-seriesid", seriesId);
  
  $("#searchpage").slideUp('slow');
  $("#addshowpage").slideDown('slow');
  stopspin(); 
}

function addNewShow() {
	var seriesid = $(this).attr("data-seriesid");
	addShowToSeriesList(seriesid);
    $("#addshowpage").slideUp('slow');
    $("#mainpage").slideDown('slow');
	
}

function buildMainScreenFromCache() {
    var start = new Date();
    console.log("build screen start: " + start.toLocaleString());

    spin();
    console.log("Rebuilding Screen");
	$("#showlist").empty();
	
	var seriesListCacheJson = localStorage.getItem("seriesListCache");
	if(seriesListCacheJson !== null) {
		var seriesListCache = JSON.parse(seriesListCacheJson);
		for(var seriesId in seriesListCache) {
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
                      addClass("icon-trash")).
                    append(
                      $("<i></i>").
                      addClass("infoButtonShow").
                      attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
                      addClass("icon-info-sign"))
                    ))
           ); 
        }        
        $(".deleteButton").click(deleteSeriesButton);
        $(".infoButtonShow").click(showInfoShow);
                
        $("#unwatchedShowList").empty();
        $("#unairedShowList").empty();

		var nextEpisodeCacheJson = localStorage.getItem("nextEpisodeCache");
		if(nextEpisodeCacheJson !== null) {
			var nextEpisodeCache = JSON.parse(nextEpisodeCacheJson);
			for(var seriesId in nextEpisodeCache) {
			  var newEpisodeAirDateString = nextEpisodeCache[seriesId]["FirstAired"];
			  var newEpisodeAirDate = parseDate(newEpisodeAirDateString);
			  var newEpisodeElement =
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
	                      addClass("icon-play-sign")).
	                    append(
	                      $("<i></i>").
	                      addClass("facebookButton").
	                      attr("data-seriesid",nextEpisodeCache[seriesId]["seriesId"]).
	                      attr("data-seasonnumber",nextEpisodeCache[seriesId]["SeasonNumber"]).
	                      attr("data-episodenumber",nextEpisodeCache[seriesId]["EpisodeNumber"]).
	                      attr("data-episodeId",nextEpisodeCache[seriesId]["episodeId"]).
	                      addClass("icon-facebook-sign"))
	                    ));
	                    
			  /*
			  Removed extra
			  .
	                    append(
	                      $("<i></i>").
	                      addClass("infoButton").
	                      attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
	                      addClass("icon-info-sign"))
			  */

			  var now = new Date();
			  if(newEpisodeAirDate < now) {
				  // Episode has already aired, so add to this existing
				  if($("#unwatchedShowList").children().length == 0) {
				      // First show - just add
			          $("#unwatchedShowList").append(newEpisodeElement);	  
				  } else {
				    var appended = false;
					$('#unwatchedShowList').children().each(function () {
					    if(!appended) {
							var thisEpisodeAirDateString = $(this).find("span.episodeFirstAired").text();
							
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
				    var appended = false;
					$('#unairedShowList').children().each(function () {
					    if(!appended) {
							var thisEpisodeAirDateString = $(this).find("span.episodeFirstAired").text();
							
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
	}
	stopspin();

	var stop = new Date();
	console.log("build screen end: " + stop.toLocaleString());
	console.log("build screen Total time: " + (stop-start)/1000);
}

function deleteSeriesButton() {
    var seriesid = $(this).attr("data-seriesid");
    deleteSeries(seriesid);
}

function showInfoShow() {
    var seriesid = $(this).attr("data-seriesid");
    var seriesUrl = getSeriesAllDetailsUrl + seriesid;

	spin();
    $.ajax({
      url: seriesUrl,
      success: seriesDisplayShowSuccess,
      error: genericError
    });
}

function seriesDisplayShowSuccess(data, status) {
  var seriesId = $(data).find("Data Series id").text();
  var seriesName = $(data).find("Data Series SeriesName").text();
  var firstAiredDate = $(data).find("Data Series FirstAired").text(); 
  var overview = $(data).find("Data Series Overview").text(); 
  var bannersrc = TheTbDbUrlBase + "/banners/" + $(data).find("Data Series banner").text();  
  $("#seasonlist").empty();
  $("#viewbannerimage").attr("src",bannersrc);
  $("#viewshowtitle").html(seriesName);
  $("#viewfirstaired").html(firstAiredDate);
  $("#viewoverview").html(overview);
  
  $("#mainpage").slideUp('slow');
  $("#showdetailspage").slideDown('slow');
  
  $(data).find("Data Episode").each(function(i) {
    var episodeName = $(this).find("EpisodeName").text();
    var seasonNumber = $(this).find("SeasonNumber").text(); 
    var seasonid = $(this).find("seasonid").text();
    var episodeNumber = $(this).find("EpisodeNumber").text();
    var firstAired = $(this).find("FirstAired").text();
    var watchedEpisodeKey = seriesId + "-" + $(this).find("id").text();
    var episodeKeyString = seasonNumber + "x" + episodeNumber;
    var episodeKey = parseInt(seasonNumber) * 100 + parseInt(episodeNumber);
    
    var appendElement;
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
              addClass("icon-play-sign").
              attr("data-seasonid",seasonid)
            ).append(
              $("<i></i>").
              addClass("unwatchseason").
              addClass("icon-eye-close").
              attr("data-seasonid",seasonid)
            )
        ));
        
        $("#seasonlist").append(appendElement);
    }
    
    // watchedEpisodeKey
    // seriesid-episodeid
    // episodeKey in watchedEpisodes
    var toggleIcon = "icon-eye-close";
    var watchedEpisodes = getWatchedEpisodes();
    console.log("Checking for: " + watchedEpisodeKey);
    if(watchedEpisodeKey in watchedEpisodes) {
	    toggleIcon = "icon-eye-close";
	    console.log("Found already watched.");
    } else {
	    toggleIcon = "icon-play-sign";
	    console.log("Not found already watched.");
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
          addClass("icon-info-sign")
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
  stopspin();
}

function watchSeason() {
	var seasonid = $(this).attr("data-seasonid");
	var dirty = false;
	console.log("Watching Season: " + seasonid);

	var watchedEpisodes = getWatchedEpisodes();
	$( "div.episodelist[data-seasonid=" + seasonid + "]" ).each(function(i) {
		var watchedEpisodeKey = $(this).attr("data-watchedkey");
		console.log("Watched: " + watchedEpisodeKey);
		if(!(watchedEpisodeKey in watchedEpisodes)) {
		  dirty = true;
		  watchedEpisodes[watchedEpisodeKey] = true;
		  $(this).find("i.toggleWatched").each(function(i) {
		    $(this).removeClass("icon-play-sign");
		    $(this).addClass("icon-eye-close");
		  });
		}
	});
	
	if(dirty) {
		saveWatchedEpisodes(watchedEpisodes);
	}
}

function unwatchSeason() {
	var seasonid = $(this).attr("data-seasonid");
	var dirty = false;
	console.log("Watching Season: " + seasonid);

	var watchedEpisodes = getWatchedEpisodes();
	$( "div.episodelist[data-seasonid=" + seasonid + "]" ).each(function(i) {
		var watchedEpisodeKey = $(this).attr("data-watchedkey");
		console.log("Unwatched key: " + watchedEpisodeKey);
		if(watchedEpisodeKey in watchedEpisodes) {
		  dirty=true;
		  delete watchedEpisodes[watchedEpisodeKey];
		  
		  // Delete realtime from Dropbox
		  if(watchedEpisodesTable) {
			  var results = watchedEpisodesTable.query({"episodeKey": watchedEpisodeKey}); 
		      for(var i=0; i< results.length; i++) {
		        results[i].deleteRecord();
		      }			  
		  }
		  
		  $(this).find("i.toggleWatched").each(function(i) {
            console.log("Toggle Eye key: " + watchedEpisodeKey);
		    $(this).removeClass("icon-eye-close");
		    $(this).addClass("icon-play-sign");
		  });
		}
	});
	if(dirty) {
		saveWatchedEpisodes(watchedEpisodes);
	}
}

function toggleWatchShow() {
	var watchedkey = $(this).attr("data-watchedkey");
	var watchedEpisodes = getWatchedEpisodes();
	if($(this).hasClass("icon-play-sign")) {
		$(this).removeClass("icon-play-sign");
		$(this).addClass("icon-eye-close");
		watchedEpisodes[watchedkey] = true;
		saveWatchedEpisodes(watchedEpisodes);
	} else {
		$(this).removeClass("icon-eye-close");
		$(this).addClass("icon-play-sign");
		delete watchedEpisodes[watchedkey];
		saveWatchedEpisodes(watchedEpisodes);
   	    // Delete realtime from Dropbox
		if(watchedEpisodesTable) {
			var results = watchedEpisodesTable.query({"episodeKey": watchedkey}); 
		    for(var i=0; i< results.length; i++) {
		      results[i].deleteRecord();
		    }			  
		}
		
	}
}

function facebookShare() {
	var seriesId = $(this).attr("data-seriesid");
	var episodeId = $(this).attr("data-episodeId");
	var seasonnumber = $(this).attr("data-seasonnumber");
	var episodenumber = $(this).attr("data-episodenumber");
	var seasonId = $(this).attr("data-seasonid");
	
	$("#facebookpost").
	  attr("data-seriesid",seriesId).
	  attr("data-episodeId",episodeId).
	  attr("data-seasonnumber",seasonnumber).
	  attr("data-episodenumber",episodenumber).
	  attr("data-seasonid",seasonId);
	
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			$("#facebookmodal").modal();
		} else {
			$("#mainpage").slideUp('slow');
			$("#settingspage").slideDown('slow');		
		}
	});
}

function facebookPlayedEpisode() {
	var seriesId = $(this).attr("data-seriesid");
	var episodeId = $(this).attr("data-episodeId");
	var seasonnumber = $(this).attr("data-seasonnumber");
	var episodenumber = $(this).attr("data-episodenumber");
	var seasonId = $(this).attr("data-seasonid");
	var episodeKey = seriesId + "-" + episodeId;
	
	var showUrl = facebookOgUrl + seriesId + "/" + seasonnumber + "/" + episodenumber;
	spin();	
    FB.api('/me/video.watches', 'post', { tv_episode: showUrl }, function(response) {
	  if (!response || response.error) {
        alert('Error occured: ' + response.error);
        $.modal.close();
      } else {
        console.log('Post ID: ' + response.id);
		var watchedEpisodes = getWatchedEpisodes();
		watchedEpisodes[episodeKey] = true;
		saveWatchedEpisodes(watchedEpisodes);	
        $.modal.close();
      }
    });	
    stopspin();
}

function playedEpisode() {
	var seriesId = $(this).attr("data-seriesid");
	var episodeId = $(this).attr("data-episodeId");
	var episodeKey = seriesId + "-" + episodeId;

	var watchedEpisodes = getWatchedEpisodes();
	watchedEpisodes[episodeKey] = true;
	saveWatchedEpisodes(watchedEpisodes);
}

function addShowToSeriesList(seriesId) {
    checkPopupFloaters();
	var seriesList = getSeriesList();
	seriesList.push(seriesId);
	saveSeriesList(seriesList);
}

function deleteSeries(seriesId) {
	var seriesList = getSeriesList();
	var newSeriesList = [];
	for (var i = 0; i < seriesList.length; i++) {
	  if(seriesList[i] !== seriesId) {
		  newSeriesList.push(seriesList[i]);
	  }
	}
	
	saveSeriesList(newSeriesList);
	if(seriesListTable) {
	  var results = seriesListTable.query({"seriesId": seriesId}); 
      for(var i=0; i< results.length; i++) {
        results[i].deleteRecord();
      }
	}
}

function getSeriesList() {
    var result = [];
	var seriesList = localStorage.getItem("seriesList");
	if(seriesList !== null) {
		result = JSON.parse(seriesList);
	}
	
	return result;
}

function getWatchedEpisodes() {
    var result = {};
	var watchedEpisodes = localStorage.getItem("watchedEpisodes");
	if(watchedEpisodes !== null) {
		result = JSON.parse(watchedEpisodes);
	}
	
	return result;
}

function saveSeriesList(seriesList) {
	var seriesListJson = JSON.stringify(seriesList);
	localStorage.setItem("seriesList", seriesListJson);
	recache();
}

function getSetting(settingKey) {
    if(settings === undefined || settings === null) {
	  var settingsJson = localStorage.getItem("settings");
	  if(settingsJson !== null) {      
		settings = JSON.parse(settingsJson);
	  } else {
		settings = {};
	  }
    }
    
    return settings[settingKey];
}

function setSetting(settingKey, settingValue) {
    if(settings === undefined || settings === null) {
	  var settingsJson = localStorage.getItem("settings");
	  if(settingsJson !== null) {      
		settings = JSON.parse(settingsJson);
	  } else {
		settings = {};
	  }
    }
    
	settings[settingKey] = settingValue;
	localStorage.setItem("settings", JSON.stringify(settings));
}

function saveWatchedEpisodes(watchedEpisodes) {
	var watchedEpisodesJson = JSON.stringify(watchedEpisodes);
	localStorage.setItem("watchedEpisodes", watchedEpisodesJson);
	recache();
}


function genericError(jqXHR, textStatus) {
    stopspin();
	alert("Failure: " + textStatus);
}


/** Dropbox Sync State Stuff **/
var isDropboxSyncing = false;
var syncKeyArray;
var dropboxTableResult;
var syncKeyIndex;
var watchedEpisodesSync;
var seriesListSync;
var localDirty;

function syncDropbox() {
    if(!isDropboxSyncing && client.isAuthenticated()) {
	  spin();
      isDropboxSyncing = true;
  	  watchedEpisodesSync = getWatchedEpisodes();
	  seriesListSync = getSeriesList();
	  localDirty = false;
	  syncKeyArray = Object.keys(watchedEpisodesSync);
	  syncKeyIndex = 0;
	  setTimeout(syncWatchedEpisodesToDropbox,0);
    }
}

function syncWatchedEpisodesToDropbox() {  
  if(syncKeyIndex < syncKeyArray.length) {
	  var episodeKey = syncKeyArray[syncKeyIndex++];
	  var results = watchedEpisodesTable.query({"episodeKey": episodeKey});
	  if(results === null || results.length === 0) {
	      watchedEpisodesTable.insert({"episodeKey": episodeKey});
	  }	  
	  setTimeout(syncWatchedEpisodesToDropbox,0);	  
  } else {
      console.log("All done syncing episodes.");
      syncKeyArray = getSeriesList();
      syncKeyIndex = 0;
      setTimeout(syncSeriesToDropbox, 0);
  }
}

function syncSeriesToDropbox() {
  if(syncKeyIndex < syncKeyArray.length) {
	  var seriesKey = syncKeyArray[syncKeyIndex++];
  	  var results = seriesListTable.query({"seriesId": seriesKey}); 
	  if(results === null || results.length === 0) {
	        seriesListTable.insert({"seriesId": seriesKey});
	  }
	  setTimeout(syncSeriesToDropbox,0);	  
  } else {
      console.log("All done syncing series.");
      dropboxTableResult = watchedEpisodesTable.query();
      syncKeyIndex = 0;
      setTimeout(syncWatchedEpisodesFromDropbox,0);
  }
}

function syncWatchedEpisodesFromDropbox() {
	if(syncKeyIndex < dropboxTableResult.length) {
		var episodeKey = dropboxTableResult[syncKeyIndex++].get("episodeKey");
		if(episodeKey !== null && !(episodeKey in watchedEpisodesSync)) {
			watchedEpisodesSync[episodeKey] = true;
			localDirty = true;
		}
		setTimeout(syncWatchedEpisodesFromDropbox,0);
	} else {
      console.log("All done syncing episodes from dropbox.");
      dropboxTableResult = seriesListTable.query();
      syncKeyIndex = 0;
      setTimeout(syncSeriesFromDropbox,0);
	}
}

function syncSeriesFromDropbox() {
	if(syncKeyIndex < dropboxTableResult.length) {
		var seriesId = dropboxTableResult[syncKeyIndex++].get("seriesId");

		if(seriesId !== null) {
			var inlocal = false;
			
			for(var j=0; j<seriesListSync.length; j++) {
				if(seriesId === seriesListSync[j]) {
					inlocal = true;
					break;
				}
			}
			if(inlocal === false) {
				seriesListSync.push(seriesId);
				localDirty = true;
			}
		}
		setTimeout(syncSeriesFromDropbox,0);
	} else {
      console.log("All done syncing series from dropbox.");
      setTimeout(syncDropboxComplete,0);
	}
}

function syncDropboxComplete() {
	if(localDirty === true) {
		saveWatchedEpisodes(watchedEpisodesSync);
		saveSeriesList(seriesListSync);
		recache();
	}

	var lastDropboxSync = new Date();
	localStorage.setItem("lastDropboxSync",lastDropboxSync.getTime());
	updateSyncDisplay();
    stopspin();
    checkPopupFloaters();
	isDropboxSyncing = false;
}

// Start the Recache
var isRecaching = false;
var seriesListRecache;
var seriesListIndex;
var nextEpisodeCache = {};
var seriesListCache = {};
function recache() {
    spin();
    if(!isRecaching) {
		seriesListRecache = getSeriesList();		
		nextEpisodeCache = {};
		seriesListCache = {};
		seriesListIndex = 0;
	    setTimeout(recacheSeries, 0);
    }
}

function recacheSeries() {
	if(seriesListIndex  < seriesListRecache.length) {
		var seriesListItem = seriesListRecache[seriesListIndex++];

    	var searchUrl = getSeriesAllDetailsUrl + seriesListItem;
        $.ajax({
          url: searchUrl,
          async: false,
          success: function(data, status) {
		      var newSeries = {};
		      var seriesId = $(data).find("Data Series id").text();
			  newSeries["seriesId"] = seriesId;
			  newSeries["seriesName"] = $(data).find("Data Series SeriesName").text();
			  newSeries["firstAiredDate"] = $(data).find("Data Series FirstAired").text(); 
			  newSeries["overview"] = $(data).find("Data Series Overview").text();
			  if( newSeries["overview"].length > 200 ) {
				  newSeries["overview"] = newSeries["overview"].substr(0,200) + "...";
			  }
			  
			  newSeries["bannersrc"] = TheTbDbUrlBase + "/banners/" + $(data).find("Data Series banner").text();
			  seriesListCache[seriesId] = newSeries;
			  var oldestUnwatchedEpisode = undefined;
		      
		      $(data).find("Data Episode").each(function(i) {
		          var episodeId = $(this).find("id").text();
		          var episodeKey = seriesId + "-" + episodeId;
		          if(!(episodeKey in getWatchedEpisodes())) {
					  var firstAired = $(this).find("FirstAired").text();
					  if(firstAired !== undefined && firstAired !== "") {
					      var firstAiredDate = new Date(firstAired);
						  var firstAiredEpoch = firstAiredDate.getTime();
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
							  oldestUnwatchedEpisode["EpisodeImage"] = TheTbDbUrlBase + "/banners/" + $(this).find("filename").text();
							  oldestUnwatchedEpisode["Overview"] = $(this).find("Overview").text();
							  if( oldestUnwatchedEpisode["Overview"].length > 200 ) {
								  oldestUnwatchedEpisode["Overview"] = oldestUnwatchedEpisode["Overview"].substr(0,200) + "...";
							  }

							  console.log(oldestUnwatchedEpisode["EpisodeName"] + ", Season: " + oldestUnwatchedEpisode["SeasonNumber"] + ", Episode: " + oldestUnwatchedEpisode["EpisodeNumber"]);
						  }
					  }
		          }
			  });
			  if(oldestUnwatchedEpisode !== null) {
				  nextEpisodeCache[seriesId] = oldestUnwatchedEpisode;
			  }
		  }});
		  setTimeout(recacheSeries, 0);
	} else {
		localStorage.setItem("nextEpisodeCache",JSON.stringify(nextEpisodeCache));
		localStorage.setItem("seriesListCache",JSON.stringify(seriesListCache));
		buildMainScreenFromCache();
	
		var lastTheTvDbSync = new Date();
		localStorage.setItem("lastTvDbSync",lastTheTvDbSync.getTime());
		updateSyncDisplay();
		stopspin();		
		isRecaching = false;
	    console.log("recache end");
	}	
}

function parseDate(input) {
  var parts = input.split('-');
  // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
  return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
}


/** Facebook Fun */
  // Additional JS functions here
  window.fbAsyncInit = function() {
    console.log("running async");
    FB.init({
      appId      : '132823190241236', // App ID
      channelUrl : '//thewirewatcher.appspot.com/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });

    console.log("Gettin facebook status");
	FB.getLoginStatus(function(response) {
	  if (response.status === 'connected') {
	    // the user is logged in and has authenticated your
	    // app, and response.authResponse supplies
	    // the user's ID, a valid access token, a signed
	    // request, and the time the access token 
	    // and signed request each expire
	    var uid = response.authResponse.userID;
	    var accessToken = response.authResponse.accessToken;
	  } else if (response.status === 'not_authorized') {
	    // the user is logged in to Facebook, 
	    // but has not authenticated your app
	  } else {
	    // the user isn't logged in to Facebook.
	  }
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

