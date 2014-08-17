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
import java.util.Iterator;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import net.chaosserver.wiredepisodes.SeriesAllXmlHandler;
import net.chaosserver.wiredepisodes.ShowInformation;
import net.chaosserver.wiredepisodes.StorageHelper;
import net.chaosserver.wiredepisodes.WatchedEpisodeCache;

import org.apache.commons.lang3.StringEscapeUtils;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ArrayNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.HandlerMapping;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import com.google.appengine.api.datastore.Key;

/**
 * Used to proxy all of the requests to TheTVDB API and TheMovieDB API. It adds an additional layer
 * of complexity by using web caching and filtering out extraneous results.
 * 
 * @author jreed
 */

@Controller
@RequestMapping(value = "/api")
public class ProxyController {
    private static final Logger log = Logger.getLogger(ProxyController.class
            .getName());

    /** References a singleton show information object. */
    @Autowired
    private ShowInformation showInformation;

    /** References a singleton caching utility object. */
    @Autowired
    private WatchedEpisodeCache watchedEpisodeCache;

    /** Document builder used for pasing the XML from The TV DB. */
    protected ThreadLocal<DocumentBuilder> dBuilderLocal = new ThreadLocal<DocumentBuilder>() {
        @Override
        protected DocumentBuilder initialValue() {
            try {
                return DocumentBuilderFactory.newInstance()
                        .newDocumentBuilder();
            } catch (ParserConfigurationException e) {
                throw new IllegalStateException(e);
            }
        }
    };

    /** Xpath processor is used to read out from the RSS feed using xpath. */
    protected ThreadLocal<XPath> xpathLocal = new ThreadLocal<XPath>() {
        @Override
        protected XPath initialValue() {
            return XPathFactory.newInstance().newXPath();
        }
    };

    /**
     * Executes a search for the show against The TV DB API and The Movie DB
     * API.
     * 
     * @param searchterm the term to search for.
     * @param request
     * @param response
     * @throws IOException
     * @throws SAXException
     * @throws XPathExpressionException
     */
    @RequestMapping(value = "/search")
    public void searchForShow(
            @RequestParam(required = true, value = "searchterm") String searchterm,
            HttpServletRequest request, HttpServletResponse response)
            throws IOException, SAXException, XPathExpressionException {

        response.setContentType("text/xml; charset=iso-8859-1");

        StringBuffer outputXml = new StringBuffer();
        outputXml.append("<Data>\n");

        // Search The TV DB
        outputXml.append(searchForShowTvDb(searchterm));

        // Search The Movie DB
        outputXml.append(searchForShowMovieDb(searchterm));

        // Output the final XML
        outputXml.append("</Data>");

        byte[] bytes = outputXml.toString().getBytes("UTF-8");
        BufferedReader inputReader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(bytes)));
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
     * Search for the show inside the Movie DB.
     * 
     * @param searchteam the show name to search for.
     * @return the XML String representing results from the TVDB
     * @return the search results as an XML.
     * @throws JsonParseException 
     * @throws IOException 
     * @throws SAXException 
     * @throws XPathExpressionException 
     */
    protected String searchForShowMovieDb(String searchterm) throws JsonParseException, IOException {
    	StringBuffer outputXml = new StringBuffer();
        URL theMovieDbUrl = new URL(
                "https://api.themoviedb.org/3/search/movie?query="
                        + URLEncoder.encode(searchterm, "UTF-8")
                        + "&api_key=" + showInformation.getMovieDbApiKey());

        ObjectMapper mapper = new ObjectMapper();
        JsonFactory factory = mapper.getJsonFactory();
        JsonParser jp = factory.createJsonParser(new BufferedInputStream(
                theMovieDbUrl.openStream()));
        JsonNode actualObj = mapper.readTree(jp);
        JsonNode resultNode = actualObj.path("results");
        if (resultNode instanceof ArrayNode) {
            Iterator<JsonNode> dataNodesIterator = ((ArrayNode) resultNode)
                    .getElements();
            while (dataNodesIterator.hasNext()) {

                JsonNode dataNode = dataNodesIterator.next();
                long id = dataNode.path("id").getLongValue();
                String title = dataNode.path("title").getTextValue();
                String release_date = dataNode.path("release_date")
                        .getTextValue();

                outputXml.append("  <Movies>\n");
                outputXml.append("    <id>");
                outputXml.append(id);
                outputXml.append("</id>\n");
                outputXml.append("    <title>");
                outputXml.append(StringEscapeUtils.escapeXml(title));
                outputXml.append("</title>\n");
                outputXml.append("    <release_date>");
                outputXml.append(StringEscapeUtils.escapeXml(release_date));
                outputXml.append("</release_date>\n");
                outputXml.append("  </Movies>\n");
            }
        }

    	return outputXml.toString();
    }

    /**
     * Search for the show inside the TV DB.
     * 
     * @param searchteam the show name to search for.
     * @return the XML String representing results from the TVDB
     * @return the search results as an XML.
     * @throws IOException 
     * @throws SAXException 
     * @throws XPathExpressionException 
     */
    protected String searchForShowTvDb(String searchterm) throws SAXException, IOException, XPathExpressionException {
    	StringBuffer outputXml = new StringBuffer();
        URL theTvDbUrl = new URL(
                "http://thetvdb.com/api/GetSeries.php?seriesname="
                        + URLEncoder.encode(searchterm, "UTF-8"));
        Document doc = dBuilderLocal.get().parse(
                new BufferedInputStream(theTvDbUrl.openStream()));
        XPath xpath = xpathLocal.get();

        double seriesNodeCount = (double) xpath.evaluate(
                "count(//Data/Series)", doc, XPathConstants.NUMBER);

        for (int i = 1; i <= seriesNodeCount; i++) {
            try {
                String seriesid = (String) xpath.evaluate("//Data/Series[" + i
                    + "]/seriesid", doc, XPathConstants.STRING);
                String seriesName = (String) xpath.evaluate("//Data/Series[" + i
                    + "]/SeriesName", doc, XPathConstants.STRING);
                String firstAired = (String) xpath.evaluate("//Data/Series[" + i
                    + "]/FirstAired", doc, XPathConstants.STRING);

                outputXml.append("  <Series>\n");
                outputXml.append("    <seriesid>");
                outputXml.append(StringEscapeUtils.escapeXml(seriesid));
                outputXml.append("</seriesid>\n");
                outputXml.append("    <SeriesName>");
                outputXml.append(StringEscapeUtils.escapeXml(seriesName));
                outputXml.append("</SeriesName>\n");
                outputXml.append("    <FirstAired>");
                outputXml.append(StringEscapeUtils.escapeXml(firstAired));
                outputXml.append("</FirstAired>\n");
                outputXml.append("  </Series>\n");
            } catch (XPathExpressionException e) {
                log.log(Level.WARNING, "Unable to parse series.",e);
            }
        }
        
        dBuilderLocal.get().reset();
        return outputXml.toString();
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
     * @param seriesId unique identifer of the series
     * @param request the http request
     * @param response the http reponse.
     * @throws IOException If there is an issue reaching TheTvDB
     */
    @RequestMapping(value = "/series/{seriesId}", method = { RequestMethod.GET })
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
        String lastModifiedHeader = connection
                .getHeaderField("Last-Modified");
        String expiresHeader = connection.getHeaderField("Expires");
        String cacheControlHeader = connection
                .getHeaderField("Cache-Control");
        if (lastModifiedHeader != null) {
            response.addHeader("Last-Modified", lastModifiedHeader);
        }
        if (expiresHeader != null) {
            response.addHeader("Expires", expiresHeader);
        }
        if (cacheControlHeader != null) {
            response.addHeader("Cache-Control", cacheControlHeader);
        }

        BufferedReader inputReader = new BufferedReader(
                new InputStreamReader(url.openStream()));
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
     * @param seriesId unique identifer of the series
     * @param request the http request
     * @param response the http reponse.
     * @throws IOException If there is an issue reaching TheTvDB
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

        // Construct the path to the TV DB API
        String path = "http://thetvdb.com/api/" + showInformation.getApiKey()
                + "/series/" + URLEncoder.encode(seriesId, "UTF-8")
                + "/all/en.xml";

        // First get the list of watched episodes for this person.
        // This can either be pulled from the Cache or from the Google Data
        // Store.
        // - Todo that allows it to be set in the session for a dropbox user
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

        // Check if the API XML is already in MemCache
        byte seriesXmlResult[] = watchedEpisodeCache.getApiResponse(path);
        if (seriesXmlResult == null) {
            // The Cache was empty so get and store the XML.
            log.info("Missed cache - loading API and caching");
            URL url = new URL(path);

            URLConnection connection = url.openConnection();
            connection.connect();

            BufferedInputStream reader = new BufferedInputStream(
                    url.openStream());
            ByteArrayOutputStream byteArrayStream = new ByteArrayOutputStream();
            BufferedOutputStream cacheWriter = new BufferedOutputStream(
                    byteArrayStream);

            byte[] buffer = new byte[1024];
            int len;
            while ((len = reader.read(buffer)) != -1) {
                cacheWriter.write(buffer, 0, len);
            }

            log.info("Missed cache - Writing API to Cache");
            cacheWriter.flush();
            cacheWriter.close();
            seriesXmlResult = byteArrayStream.toByteArray();
            log.info("Missed cache - Writing XML to Cache with bytes: "
                    + seriesXmlResult.length);
            watchedEpisodeCache.putApiResponse(path, seriesXmlResult);
        }

        response.setContentType("text/xml");
        InputStream byteInputStream = new BufferedInputStream(
                new ByteArrayInputStream(seriesXmlResult));

        SAXParser saxParser = SAXParserFactory.newInstance().newSAXParser();
        PrintWriter printWriter = response.getWriter();
        SeriesAllXmlHandler seriesAllXmlHandler = new SeriesAllXmlHandler(
                printWriter, watchedEpisodeSet);
        saxParser.parse(byteInputStream, seriesAllXmlHandler);
        printWriter.flush();
        printWriter.close();
    }

    /**
     * Proxing the Request to The Movie DB API to get information about the
     * series. The frontend webapp only reads the following fields:
     * <ul>
     * <li>Data Series id</li>
     * <li>Data Series SeriesName</li>
     * <li>Data Series FirstAired</li>
     * <li>Data Series Overview</li>
     * <li>Data Series banner</li>
     * </ul>
     * 
     * @param seriesId unique identifer of the series
     * @param request the http request
     * @param response the http reponse.
     * @throws IOException If there is an issue reaching TheTvDB
     */
    @RequestMapping(value = "/movies/{movieId}", method = { RequestMethod.GET })
    public void getMovieDetails(@PathVariable String movieId,
            HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("text/xml; charset=iso-8859-1");
        StringBuffer outputXml = new StringBuffer();

        // Search The Movie DB
        URL theMovieDbUrl = new URL("https://api.themoviedb.org/3/movie/"
                + URLEncoder.encode(movieId, "UTF-8") + "?api_key="
                + showInformation.getMovieDbApiKey());

        ObjectMapper mapper = new ObjectMapper();
        JsonFactory factory = mapper.getJsonFactory();
        JsonParser jp = factory.createJsonParser(new BufferedInputStream(
                theMovieDbUrl.openStream()));
        JsonNode actualObj = mapper.readTree(jp);

        outputXml.append("<Data>\n");
        outputXml.append("  <Movie>\n");

        // Output the final XML
        outputXml.append("    <id>");
        outputXml.append(actualObj.path("id").getIntValue());
        outputXml.append("</id>\n");
        outputXml.append("    <title>");
        outputXml.append(StringEscapeUtils.escapeXml(actualObj.path("original_title").getTextValue()));
        outputXml.append("</title>\n");
        outputXml.append("    <releaseDate>");
        outputXml.append(StringEscapeUtils.escapeXml(actualObj.path("release_date").getTextValue()));
        outputXml.append("</releaseDate>\n");
        outputXml.append("    <overview>");
        outputXml.append(StringEscapeUtils.escapeXml(actualObj.path("overview").getTextValue()));
        outputXml.append("</overview>\n");
        outputXml.append("    <posterPath>");
        outputXml.append(StringEscapeUtils.escapeXml(actualObj.path("poster_path").getTextValue()));
        outputXml.append("</posterPath>\n");
        outputXml.append("  </Movie>\n");
        outputXml.append("</Data>");

        byte[] bytes = outputXml.toString().getBytes("UTF-8");
        BufferedReader inputReader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(bytes)));
        PrintWriter printWriter = response.getWriter();

        String nextLine = inputReader.readLine();
        while (nextLine != null) {
            printWriter.println(SeriesAllXmlHandler
                    .stripNonValidXMLCharacters(nextLine));
            nextLine = inputReader.readLine();
        }

        dBuilderLocal.get().reset();
        printWriter.flush();
        printWriter.close();

    }

    /**
     * Returns the banner from Teh TV DB.
     */
    @RequestMapping(value = "/banners/**", method = { RequestMethod.GET,
            RequestMethod.HEAD })
    public void getSeriesBannerImage(HttpServletRequest request,
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
                response.addHeader("Cache-Control",
                        "public, max-age=31556926");
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
                        log.info("Missed cache - Writing Image to Cache with bytes: "
                                + imageBytes.length);
                        watchedEpisodeCache.putEpisodeImage(path, imageBytes);

                    } catch (Exception e) {
                        log.log(Level.INFO,
                                "Streaming null image because of Exception",
                                e);
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
