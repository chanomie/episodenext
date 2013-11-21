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
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.security.Principal;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import net.chaosserver.wiredepisodes.SeriesAllXmlHandler;
import net.chaosserver.wiredepisodes.ShowInformation;
import net.chaosserver.wiredepisodes.StorageHelper;
import net.chaosserver.wiredepisodes.WatchedEpisodeCache;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.HandlerMapping;
import org.xml.sax.SAXException;

import com.google.appengine.api.datastore.Key;

@Controller
@RequestMapping(value = "/api")
public class ProxyController {
	private static final Logger log = Logger.getLogger(ProxyController.class
			.getName());

	@Autowired
	private ShowInformation showInformation;

	@Autowired
	private WatchedEpisodeCache watchedEpisodeCache;

	@RequestMapping(value = "/getseries")
	public void searchForSeries(
			@RequestParam(required = true, value = "seriesname") String seriesname,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException {

		URL url = new URL("http://thetvdb.com/api/GetSeries.php?seriesname="
				+ URLEncoder.encode(seriesname, "UTF-8"));
		URLConnection connection = url.openConnection();
		connection.connect();
		response.setContentType(connection.getContentType());

		// Handle Cache Headers
		String lastModifiedHeader = connection.getHeaderField("Last-Modified");
		String expiresHeader = connection.getHeaderField("Expires");
		String cacheControlHeader = connection.getHeaderField("Cache-Control");
		if (lastModifiedHeader != null) {
			response.addHeader("Last-Modified", lastModifiedHeader);
		}
		if (expiresHeader != null) {
			response.addHeader("Expires", expiresHeader);
		}
		if (cacheControlHeader != null) {
			response.addHeader("Cache-Control", cacheControlHeader);
		}

		BufferedReader inputReader = new BufferedReader(new InputStreamReader(
				url.openStream()));
		PrintWriter printWriter = response.getWriter();

		String nextLine = inputReader.readLine();
		while (nextLine != null) {
			printWriter.println(SeriesAllXmlHandler
					.stripNonValidXMLCharacters(nextLine));
			nextLine = inputReader.readLine();
		}

		printWriter.flush();
		printWriter.close();

	}

	/**
	 * Proxing the Request to the TV DB API to get information about the series.
	 * The frontend webapp only reads the following fields:
	 * <ul>
	 * <li>Data Series id</li>
	 * <li>Data Series SeriesName</li>
	 * <li>Data Series FirstAired</li>
	 * <li>Data Series Overview</li>
	 * <li>Data Series banner</li>
	 * </ul>
	 * 
	 * @param seriesId
	 *            unique identifer of the series
	 * @param request
	 *            the http request
	 * @param response
	 *            the http reponse.
	 * @throws IOException
	 *             If there is an issue reaching TheTvDB
	 */
	@RequestMapping(value = "/{seriesId}", method = { RequestMethod.GET })
	public void getSeriesDetails(@PathVariable String seriesId,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException {

		response.setContentType(request.getContentType());
		URL url = new URL("http://thetvdb.com/api/"
				+ showInformation.getApiKey() + "/series/"
				+ URLEncoder.encode(seriesId, "UTF-8") + "/en.xml");
		URLConnection connection = url.openConnection();
		connection.connect();
		response.setContentType(connection.getContentType());

		// Handle Cache Headers
		String lastModifiedHeader = connection.getHeaderField("Last-Modified");
		String expiresHeader = connection.getHeaderField("Expires");
		String cacheControlHeader = connection.getHeaderField("Cache-Control");
		if (lastModifiedHeader != null) {
			response.addHeader("Last-Modified", lastModifiedHeader);
		}
		if (expiresHeader != null) {
			response.addHeader("Expires", expiresHeader);
		}
		if (cacheControlHeader != null) {
			response.addHeader("Cache-Control", cacheControlHeader);
		}

		BufferedReader inputReader = new BufferedReader(new InputStreamReader(
				url.openStream()));
		PrintWriter printWriter = response.getWriter();

		String nextLine = inputReader.readLine();
		while (nextLine != null) {
			printWriter.println(SeriesAllXmlHandler
					.stripNonValidXMLCharacters(nextLine));
			nextLine = inputReader.readLine();
		}

		printWriter.flush();
		printWriter.close();

	}

	/**
	 * Proxing the Request to the TV DB API to get all information about the
	 * series. The frontend webapp only reads the following fields:
	 * <ul>
	 * <li>Data Series id</li>
	 * <li>Data Series SeriesName</li>
	 * <li>Data Series FirstAired</li>
	 * <li>Data Series Overview</li>
	 * <li>Data Series banner</li>
	 * <li>Data Episode EpisodeName</li>
	 * <li>Data Episode SeasonNumber</li>
	 * <li>Data Episode seasonid</li>
	 * <li>Data Episode EpisodeNumber</li>
	 * <li>Data Episode FirstAired</li>
	 * <li>Data Episode id</li>
	 * </ul>
	 * 
	 * @param seriesId
	 *            unique identifer of the series
	 * @param request
	 *            the http request
	 * @param response
	 *            the http reponse.
	 * @throws IOException
	 *             If there is an issue reaching TheTvDB
	 * @throws SAXException
	 * @throws ParserConfigurationException
	 */

	@RequestMapping(value = "/all/{seriesId}", method = RequestMethod.GET)
	public void getAllSeriesDetails(
			@PathVariable String seriesId,
			@RequestParam(required = false, value = "includeall", defaultValue = "true") String includeall,
			HttpServletRequest request, HttpServletResponse response,
			Principal principal) throws IOException, SAXException,
			ParserConfigurationException {

		response.setContentType(request.getContentType());
		URL url = new URL("http://thetvdb.com/api/"
				+ showInformation.getApiKey() + "/series/"
				+ URLEncoder.encode(seriesId, "UTF-8") + "/all/en.xml");
		URLConnection connection = url.openConnection();
		connection.connect();
		response.setContentType(connection.getContentType());

		Set<String> watchedEpisodeSet = null;
		if (!Boolean.parseBoolean(includeall) && principal != null) {
			log.info("Pulling back the list of watched episodes from JCache");
			Key principalKey = StorageHelper.getPrincipalKey(principal);

			watchedEpisodeSet = watchedEpisodeCache
					.getWatchedEpisodesKeys(principalKey);

			if (watchedEpisodeSet == null) {
				log.info("Cache was empty.  Pulling back from Datastore.");
				try {
					watchedEpisodeSet = StorageHelper.getWatchedEpisodesKeys(
							StorageHelper.getPrincipalKey(principal), null);

					watchedEpisodeCache.putWatchedEpisodesKeys(principalKey,
							watchedEpisodeSet);
				} catch (com.google.apphosting.api.ApiProxy.OverQuotaException e) {
					// If it's over quota for the data store, just pull back the
					// whole lovely list.
					watchedEpisodeSet = null;
				}
			}
		}

		// BufferedReader inputReader = new BufferedReader(new
		// InputStreamReader(url.openStream()));
		SAXParser saxParser = SAXParserFactory.newInstance().newSAXParser();
		PrintWriter printWriter = response.getWriter();
		SeriesAllXmlHandler seriesAllXmlHandler = new SeriesAllXmlHandler(
				printWriter, watchedEpisodeSet);
		saxParser.parse(url.openStream(), seriesAllXmlHandler);
		printWriter.flush();
		printWriter.close();

	}

	@RequestMapping(value = "/banners/**", method = { RequestMethod.GET,
			RequestMethod.HEAD })
	public void getAllSeriesDetails(HttpServletRequest request,
			HttpServletResponse response) throws IOException {

		String path = (String) request
				.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
		path = path.replaceAll("/api", "http://thetvdb.com");
		String method = request.getMethod();
		String ifNoneMatch = request.getHeader("If-None-Match");
		// If there is a "If None Match" header, than it was etagged, so just
		// tell it not modified. If we try and pull it and the result comes
		// as text/html, something has gone wrong. error 500 or something,
		// so we need to do some clever.
		if (ifNoneMatch != null) {
			log.info("Got If-None-Match so sending etag not modified");
			// Just set a cache header to expire in 1 - year
			response.addHeader("Cache-Control", "public, max-age=31556926");
			response.addHeader("ETag", Integer.toString(path.hashCode()));
			response.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
		} else {
			// First Check the Cache for the Image
			byte episodeImage[] = watchedEpisodeCache.getEpisodeImage(path);
			if (episodeImage != null) {
				log.info("Hit cache - returning image from Cache");
				response.setContentType("image/jpeg");
				response.addHeader("Cache-Control", "public, max-age=31556926");
				response.addHeader("ETag", Integer.toString(path.hashCode()));

				BufferedInputStream reader = new BufferedInputStream(
						new ByteArrayInputStream(episodeImage));
				BufferedOutputStream writer = new BufferedOutputStream(
						response.getOutputStream());

				byte[] buffer = new byte[1024];
				int len;
				while ((len = reader.read(buffer)) != -1) {
					writer.write(buffer, 0, len);
				}

				writer.flush();
				writer.close();
			} else {
				// The Cache was empty so try getting/storing image
				log.info("Missed cache - loading image and caching");
				URL url = new URL(path);
				HttpURLConnection connection = (HttpURLConnection) url
						.openConnection();
				connection.setRequestMethod(method);
				connection.connect();
				String contentType = connection.getContentType();

				if (contentType.contains("text/html")) {
					streamNoImage(response);
				} else {
					try {
						response.setContentType(contentType);

						// Just set a cache header to expire in 1 - year
						response.addHeader("Cache-Control",
								"public, max-age=31556926");
						response.addHeader("ETag",
								Integer.toString(path.hashCode()));

						BufferedInputStream reader = new BufferedInputStream(
								url.openStream());
						BufferedOutputStream writer = new BufferedOutputStream(
								response.getOutputStream());
						ByteArrayOutputStream byteArrayStream = new ByteArrayOutputStream();
						BufferedOutputStream cacheWriter = new BufferedOutputStream(
								byteArrayStream);

						byte[] buffer = new byte[1024];
						int len;
						while ((len = reader.read(buffer)) != -1) {
							writer.write(buffer, 0, len);
							cacheWriter.write(buffer, 0, len);
						}

						log.info("Missed cache - Writing Image to Stream");
						writer.flush();
						writer.close();

						log.info("Missed cache - Writing Image to Cache");
						cacheWriter.flush();
						cacheWriter.close();
						byte[] imageBytes = byteArrayStream.toByteArray();
						log.info("Missed cache - Writing Image to Cache with bytes: " + imageBytes.length);
						watchedEpisodeCache.putEpisodeImage(path, imageBytes);
						
					} catch (Exception e) {
						log.log(Level.INFO,
								"Streaming null image because of Exception", e);
						streamNoImage(response);
					}
				}
			}
		}
	}

	protected void streamNoImage(HttpServletResponse response)
			throws IOException {
		response.setContentType("image/png");
		response.addHeader("Pragma", "no-cache");
		response.addHeader("Cache-Control", "no-cache, must-revalidate");

		InputStream inputStream = ProxyController.class
				.getResourceAsStream("/resources/img/noimage.png");
		BufferedInputStream reader = new BufferedInputStream(inputStream);
		BufferedOutputStream writer = new BufferedOutputStream(
				response.getOutputStream());

		byte[] buffer = new byte[1024];
		int len;
		while ((len = reader.read(buffer)) != -1) {
			writer.write(buffer, 0, len);
		}

		writer.flush();
		writer.close();
	}
}
