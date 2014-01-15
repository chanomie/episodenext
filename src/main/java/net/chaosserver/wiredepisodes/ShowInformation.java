/**
 *  Copyright 2013 Jordan Reed
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *   
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *   
 * http://code.google.com/p/thewirewatcher/
 */
package net.chaosserver.wiredepisodes;

import java.util.List;

import com.omertron.thetvdbapi.TheTVDBApi;
import com.omertron.thetvdbapi.model.Episode;
import com.omertron.thetvdbapi.model.Series;

public class ShowInformation {
	protected String apiKey;
	protected TheTVDBApi tvDB;
	protected String TheTbDbUrlBase = "http://thetvdb.com";
	
	public ShowInformation() {
		apiKey = System.getProperty("thetvdb.apikey");
		if(apiKey == null) {
			apiKey = System.getenv("thetvdbapikey");
		}
		tvDB = new TheTVDBApi(apiKey);
	}
	
	public void setApiKey(String apiKey) {
		this.apiKey = apiKey;
		tvDB = new TheTVDBApi(apiKey);
	}
	
	public String getApiKey() {
		return apiKey;
	}
	
	public List<Series> searchSeries(String title) {
		return tvDB.searchSeries(title, "en");
	}
	
	public Series getSeries(String id) {
		return tvDB.getSeries(id, "en");
	}
	
	public List<Episode> getAllEpisodes(String id) {
		return tvDB.getAllEpisodes(id, "en");
	}
	
	public Episode getEpisode(String id, int seasonNumber, int episodeNumber) {
		return this.getEpisode(id, seasonNumber, episodeNumber, "en");
	}

	public Episode getEpisode(String id, int seasonNumber, int episodeNumber, String language) {
		return tvDB.getEpisode(id, seasonNumber, episodeNumber, language);
	}
	
	public String getSeriesUrl(Series series) {
		StringBuilder seriesUrl = new StringBuilder();
		
		seriesUrl.append(TheTbDbUrlBase);
		seriesUrl.append("/?tab=series");
		seriesUrl.append("&id=");
		seriesUrl.append(series.getId());
		seriesUrl.append("&lid=7");

		return seriesUrl.toString();
	}
	
	public String getEpisodeUrl(Episode episode) {
		StringBuilder episodeUrl = new StringBuilder();
		
		episodeUrl.append(TheTbDbUrlBase);
		episodeUrl.append("/?tab=episode");
		episodeUrl.append("&seriesid=");
		episodeUrl.append(episode.getSeriesId());
		episodeUrl.append("&seasonid=");
		episodeUrl.append(episode.getSeasonId());
		episodeUrl.append("&id=");
		episodeUrl.append(episode.getId());
		episodeUrl.append("&lid=7");

		return episodeUrl.toString();
	}
}
