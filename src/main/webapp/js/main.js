// Insert your Dropbox app key here:
var DROPBOX_APP_KEY = 'daywyfneqb6yg8i';

// Exposed for easy access in the browser console.
var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
var seriesListTable;
var watchedEpisodesTable;

var TheTbDbUrlBase = "http://thetvdb.com";
var getSeriesUrl = "http://thewirewatcher.appspot.com/api/getseries?seriesname=";
var getSeriesDetailsUrl = "http://thewirewatcher.appspot.com/api/"
var getSeriesAllDetailsUrl = "http://thewirewatcher.appspot.com/api/all/"

$(document).ready(function() {
  $("#addshowbutton").click(function() {
    $("#mainpage").slideUp('slow');
    $("#searchpage").slideDown('slow');
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
  })
    
  $("#addnewshowbutton").click(addNewShow);
  $('#addshowform').submit(onSearch);
  $("#recache").click(recache);
  $("#dropboxSyncButton").click(syncDropbox);
  $('#dropboxLoginButton').click(function (e) {
  	    console.log("dropboxLoginButton");
		e.preventDefault();
		// This will redirect the browser to OAuth login.
		client.authenticate();
	});

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
			
			// Ensure that future changes update the list.
			// datastore.recordsChanged.addListener(updateList);
		});
	}

  
  buildMainScreenFromCache();
});

function onSearch() {
  var showname = $("#searchtext").val();
  if(showname === null || showname === "") {
	  // error
  } else {
    $("#searchResultList").empty()
    searchForShow(showname);
  }
  return false;	
}

function searchForShow(showname) {
    var encodedName = encodeURIComponent(showname);
    var searchUrl = getSeriesUrl + encodedName;
    
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
				addClass("rightarrow"));
			
			
         $("#searchResultList").append(newSeries);	
	});
	
	$(".seriesrow").click(displayShowDetails);
}

function displayShowDetails() {
    var seriesid = $(this).attr("data-seriesid");
    console.log("Getting show detail: " + seriesid);
    var searchUrl = getSeriesDetailsUrl + seriesid;

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
}

function addNewShow() {
	var seriesid = $(this).attr("data-seriesid");
	addShowToSeriesList(seriesid);
    $("#addshowpage").slideUp('slow');
    $("#mainpage").slideDown('slow');
	
}

function buildMainScreenFromCache() {
    console.log("Rebuilding Screen");
	$("#showlist").empty();
	
	var seriesListCacheJson = localStorage.getItem("seriesListCache");
	if(seriesListCacheJson !== null) {
		var seriesListCache = JSON.parse(seriesListCacheJson);
		for(var seriesId in seriesListCache){
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
		var nextEpisodeCacheJson = localStorage.getItem("nextEpisodeCache");
		if(nextEpisodeCacheJson !== null) {
			var nextEpisodeCache = JSON.parse(nextEpisodeCacheJson);
			for(var seriesId in nextEpisodeCache){
			  console.log("Adding in unwatched show: " + seriesId);
	          $("#unwatchedShowList").append(
	            $("<div></div>").
	            	attr("id",("series-"+nextEpisodeCache[seriesId]["seriesId"])).
	            	attr("data-seriesid",nextEpisodeCache[seriesId]["seriesId"]).
	            	addClass("show").
	            	append(
	            	  $("<div></div>").
	            	  addClass("listbannerimage").
	            	  append(
	                	  $("<img></img>").
	                	  attr("src",nextEpisodeCache[seriesId]["bannersrc"]))).
	                append(
	                  $("<div></div>").
	                  addClass("showtext").
	                  append(
	                    $("<span></span>").
	                    addClass("episodeshowname").
	                    html(nextEpisodeCache[seriesId]["seriesName"])
	                    ).
	                  append(
	                    $("<span></span>").
	                    addClass("episodetitle").
	                    html(nextEpisodeCache[seriesId]["EpisodeName"])
	                    ).
	                  append(
	                    $("<span></span>").
	                    addClass("episodeFirstAired").
	                    html(nextEpisodeCache[seriesId]["FirstAired"])
	                    ).
	                  append(
	                    $("<div></div>").
	                    addClass("seasonepisode").
	                    html("Season " + nextEpisodeCache[seriesId]["SeasonNumber"] + ", Episode " + nextEpisodeCache[seriesId]["EpisodeNumber"])).
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
	                      addClass("icon-facebook-sign")).
	                    append(
	                      $("<i></i>").
	                      addClass("infoButton").
	                      attr("data-seriesid",seriesListCache[seriesId]["seriesId"]).
	                      addClass("icon-info-sign"))
	                    ))
	           ); 
			}
		}
		$(".playedButton").click(playedEpisode);		
	}
}

function deleteSeriesButton() {
    var seriesid = $(this).attr("data-seriesid");
    deleteSeries(seriesid);
}

function showInfoShow() {
    var seriesid = $(this).attr("data-seriesid");
    // deleteSeries(seriesid);	
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

function saveWatchedEpisodes(watchedEpisodes) {
	var watchedEpisodesJson = JSON.stringify(watchedEpisodes);
	localStorage.setItem("watchedEpisodes", watchedEpisodesJson);
	recache();
	
}


function genericError(jqXHR, textStatus) {
	alert("Failure: " + textStatus);
}

function syncDropbox() {
    console.log("client.isAuthenticated(): " + client.isAuthenticated());
    if(client.isAuthenticated()) {
  	  var watchedEpisodes = getWatchedEpisodes();
	  var seriesList = getSeriesList();
	  var localDirty = false;
	  
	  // Add to Dropbox
	  console.log("Adding Watched Episodes to Dropbox");
	  for(episodeKey in watchedEpisodes) {
        console.log("Checking for key: " + episodeKey);
	    var results = watchedEpisodesTable.query({"episodeKey": episodeKey});
        console.log("Result table has: " + results.length);
	    if(results === null || results.length === 0) {
	        console.log("Adding dropbox key: " + episodeKey);
	        watchedEpisodesTable.insert({"episodeKey": episodeKey});
	    } else {
	        console.log("Existing dropbox key: " + episodeKey);		    
	    }
	  }
	  
	  console.log("Adding Series List to Dropbox");
	  for(var i=0; i<seriesList.length; i++) {
        console.log("Checking for key: " + seriesList[i]);
  	    var results = seriesListTable.query({"seriesId": seriesList[i]}); 
        console.log("Result table has: " + results.length);
	    if(results === null || results.length === 0) {
	        console.log("Adding dropbox key: " + seriesList[i]);
	        seriesListTable.insert({"seriesId": seriesList[i]});
	    } else {
	        console.log("Existing dropbox key: " + seriesList[i]);		    
	    }
	  }
	  
	  // Add to Local
	  var dropboxWatched = watchedEpisodesTable.query();
	  for(var i=0; i< dropboxWatched.length; i++) {
		  var episodeKey = dropboxWatched[i].get("episodeKey");
		  if(episodeKey !== null && !(episodeKey in watchedEpisodes)) {
	        console.log("Adding local key: " + episodeKey);
		    watchedEpisodes[episodeKey] = true;
		    localDirty = true;
		  } else {
	        console.log("Existing local key: " + episodeKey);
		  }
	  }

	  console.log("Adding Dropbox to Series List");
	  var dropboxSeriesList = seriesListTable.query();
	  console.log("dropboxSeriesList.length: " + dropboxSeriesList.length);
	  for(var i=0; i<dropboxSeriesList.length; i++) {
		  var seriesId = dropboxSeriesList[i].get("seriesId");
		  console.log("Checking: " + seriesId);
		  
		  if(seriesId !== null) {
			  console.log("Checking: " + seriesId);
			  var inlocal = false;
			  
			  for(var j=0; j<seriesList.length; j++) {
				  if(seriesId === seriesList[j]) {
					  inlocal = true;
					  break;
				  }
			  }
			  if(inlocal === false) {
	              console.log("Adding series local key: " + seriesId);
				  seriesList.push(seriesId);
				  localDirty = true;
			  } else {
	              console.log("Existing series local key: " + seriesId);
				  
			  }
          }
	  }
	  
	  if(localDirty === true) {
	      console.log("Saving lists locally");
	      saveWatchedEpisodes(watchedEpisodes);
		  saveSeriesList(seriesList);
		  
	  }  
   }
}

function recache() {
	var seriesList = getSeriesList();
	var watchedEpisodes = getWatchedEpisodes();
	
	var nextEpisodeCache = {};
	var seriesListCache = {};
	for (var i = 0; i < seriesList.length; i++) {
    	// 1: Get a the series details into the local cache
    	// 2: Rebuild the unwatched episode cache
    	
    	var searchUrl = getSeriesAllDetailsUrl + seriesList[i];
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
		          if(!(episodeKey in watchedEpisodes)) {
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
	}
	
	localStorage.setItem("nextEpisodeCache",JSON.stringify(nextEpisodeCache));
	localStorage.setItem("seriesListCache",JSON.stringify(seriesListCache));
	buildMainScreenFromCache();
}
