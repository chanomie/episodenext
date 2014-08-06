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
package net.chaosserver.wiredepisodes.web;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.logging.Logger;

import net.chaosserver.wiredepisodes.ShowInformation;

import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.map.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import com.omertron.thetvdbapi.model.Episode;
import com.omertron.thetvdbapi.model.Series;

/**
 * Returns data used with OpenGraph.
 * 
 * @author jreed
 * 
 */
@Controller
public class EpisodeController {
    private static final Logger log = Logger
            .getLogger(EpisodeController.class.getName());

    @Autowired
    private ShowInformation showInformation;

    @RequestMapping(value = "/showdetails", method = RequestMethod.GET)
    public String get() {
        return "episode/view";
    }

    @RequestMapping(value = "/moviedetails/{movieId}", method = RequestMethod.GET)
    public String getMovieDetails(
            @PathVariable String movieId,
            @RequestParam(value = "ignoreUA", required = false) String ignoreUA,
            @RequestHeader("User-Agent") String userAgent, Model model)
            throws JsonParseException, IOException {

        String resultView = "episodes/error404";
        try {
            URL theMovieDbUrl = new URL("https://api.themoviedb.org/3/movie/"
                    + URLEncoder.encode(movieId, "UTF-8") + "?api_key="
                    + showInformation.getMovieDbApiKey());

            ObjectMapper mapper = new ObjectMapper();
            JsonFactory factory = mapper.getJsonFactory();
            JsonParser jp = factory.createJsonParser(new BufferedInputStream(
                    theMovieDbUrl.openStream()));
            JsonNode actualObj = mapper.readTree(jp);

            String theMovieUrl = "https://www.themoviedb.org/movie/"
                    + movieId;
            model.addAttribute("movieId", movieId);
            model.addAttribute("moviedbUrl", theMovieUrl);
            model.addAttribute("title", actualObj.path("original_title")
                    .getTextValue());
            model.addAttribute("image", actualObj.path("poster_path")
                    .getTextValue());
            model.addAttribute("description", actualObj.path("overview")
                    .getTextValue());

            if (!actualObj.path("id").isMissingNode()) {
                if (userAgent != null
                        && userAgent.contains("facebookexternalhit")
                        || Boolean.parseBoolean(ignoreUA)) {

                    resultView = "movie/view";
                } else {
                    resultView = "redirect:" + theMovieUrl;
                }
            } else {
                resultView = "episodes/error404";
            }
        } catch (NumberFormatException e) {
            resultView = "episodes/error404";
        }

        return resultView;
    }

    @RequestMapping(value = "/showdetails/{seriesId}", method = RequestMethod.GET)
    public String getSeriesDetails(
            @PathVariable String seriesId,
            @RequestParam(value = "ignoreUA", required = false) String ignoreUA,
            @RequestHeader("User-Agent") String userAgent, Model model) {

        String resultView = "episodes/error404";
        try {
            Series series = showInformation.getSeries(seriesId);
            model.addAttribute("series", series);

            if (series != null) {
                if (userAgent != null
                        && userAgent.contains("facebookexternalhit")
                        || Boolean.parseBoolean(ignoreUA)) {

                    resultView = "series/view";
                } else {
                    resultView = "redirect:"
                            + showInformation.getSeriesUrl(series);
                }
            }
        } catch (NumberFormatException e) {
            resultView = "episodes/error404";
        }

        return resultView;
    }

    @RequestMapping(value = "/showdetails/{seriesId}/{seasonNumber}/{episodeNumber}", method = RequestMethod.GET)
    public String getEpisodeDetails(
            @PathVariable String seriesId,
            @PathVariable String seasonNumber,
            @PathVariable String episodeNumber,
            @RequestParam(value = "ignoreUA", required = false) String ignoreUA,
            @RequestHeader("User-Agent") String userAgent, Model model) {

        String resultView = "episodes/error404";
        log.info("Request to series API has User-Agent: " + userAgent);

        try {
            Series series = showInformation.getSeries(seriesId);
            model.addAttribute("series", series);

            Episode episode = showInformation.getEpisode(seriesId,
                    Integer.parseInt(seasonNumber),
                    Integer.parseInt(episodeNumber));
            model.addAttribute("episode", episode);

            if (series != null && episode != null) {
                if (userAgent != null
                        && userAgent.contains("facebookexternalhit")
                        || Boolean.parseBoolean(ignoreUA)) {
                    resultView = "episode/view";
                } else {
                    resultView = "redirect:"
                            + showInformation.getEpisodeUrl(episode);
                }
            }
        } catch (NumberFormatException e) {
            resultView = "episodes/error404";
        }

        return resultView;
    }
}
