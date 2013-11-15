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
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.chaosserver.wiredepisodes.ShowInformation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.HandlerMapping;

@Controller
@RequestMapping(value="/api")
public class ProxyController {
	private static final Logger log = Logger.getLogger(ProxyController.class.getName());

	   @Autowired
	   private ShowInformation showInformation;

	   @RequestMapping(value="/getseries")
	   public void searchForSeries(
			   @RequestParam(required = true, value = "seriesname") String seriesname,
			   HttpServletRequest request, HttpServletResponse response) throws IOException {

		   URL url = new URL("http://thetvdb.com/api/GetSeries.php?seriesname=" + URLEncoder.encode(seriesname,"UTF-8"));
		   URLConnection connection = url.openConnection();
		   connection.connect();
		   response.setContentType(connection.getContentType());
		   
		   // Handle Cache Headers
		   String lastModifiedHeader = connection.getHeaderField("Last-Modified");
		   String expiresHeader = connection.getHeaderField("Expires");
		   String cacheControlHeader = connection.getHeaderField("Cache-Control");
		   if(lastModifiedHeader != null) {
	   		   response.addHeader("Last-Modified", lastModifiedHeader);
   		   }
   		   if(expiresHeader != null) {
			   response.addHeader("Expires", expiresHeader);
   		   }
   		   if(cacheControlHeader != null) {
			   response.addHeader("Cache-Control", cacheControlHeader);
   		   }
		   
		   
	       BufferedReader inputReader = new BufferedReader(new InputStreamReader(url.openStream()));
	       PrintWriter printWriter = response.getWriter();
	       
	       String nextLine = inputReader.readLine();
	       while(nextLine != null) {
			   printWriter.println(stripNonValidXMLCharacters(nextLine));
		       nextLine = inputReader.readLine();
	       }
	       
		   
		   printWriter.flush();
		   printWriter.close();


	   }
	   
	   /**
	    * Proxing the Request to the TV DB API to get information about the series.
	    * The frontend webapp only reads the following fields:
	    * <ul>
	    *   <li>Data Series id</li>
	    *   <li>Data Series SeriesName</li>
	    *   <li>Data Series FirstAired</li>
	    *   <li>Data Series Overview</li>
	    *   <li>Data Series banner</li>
	    * </ul>
	    * 
	    * @param seriesId unique identifer of the series
	    * @param request the http request
	    * @param response the http reponse.
	    * @throws IOException If there is an issue reaching TheTvDB
	    */
	   @RequestMapping(value="/{seriesId}", method = { RequestMethod.GET })
	   public void getSeriesDetails(
			   @PathVariable String seriesId,
			   HttpServletRequest request, HttpServletResponse response) throws IOException {

		   response.setContentType(request.getContentType());
		   URL url = new URL("http://thetvdb.com/api/" + showInformation.getApiKey()
				   + "/series/" + URLEncoder.encode(seriesId,"UTF-8") + "/en.xml");
		   URLConnection connection = url.openConnection();
		   connection.connect();
		   response.setContentType(connection.getContentType());

		   // Handle Cache Headers
		   String lastModifiedHeader = connection.getHeaderField("Last-Modified");
		   String expiresHeader = connection.getHeaderField("Expires");
		   String cacheControlHeader = connection.getHeaderField("Cache-Control");
		   if(lastModifiedHeader != null) {
	   		   response.addHeader("Last-Modified", lastModifiedHeader);
   		   }
   		   if(expiresHeader != null) {
			   response.addHeader("Expires", expiresHeader);
   		   }
   		   if(cacheControlHeader != null) {
			   response.addHeader("Cache-Control", cacheControlHeader);
   		   }
		   
	       BufferedReader inputReader = new BufferedReader(new InputStreamReader(url.openStream()));
	       PrintWriter printWriter = response.getWriter();
	       
	       String nextLine = inputReader.readLine();
	       while(nextLine != null) {
			   printWriter.println(stripNonValidXMLCharacters(nextLine));
		       nextLine = inputReader.readLine();
	       }
	       
		   
		   printWriter.flush();
		   printWriter.close();

		   
	   }

	   /**
	    * Proxing the Request to the TV DB API to get all information about the series.
	    * The frontend webapp only reads the following fields:
	    * <ul>
	    *   <li>Data Series id</li>
	    *   <li>Data Series SeriesName</li>
	    *   <li>Data Series FirstAired</li>
	    *   <li>Data Series Overview</li>
	    *   <li>Data Series banner</li>
	    *   <li>Data Episode EpisodeName</li>
	    *   <li>Data Episode SeasonNumber</li>
	    *   <li>Data Episode seasonid</li>
	    *   <li>Data Episode EpisodeNumber</li>
	    *   <li>Data Episode FirstAired</li>
	    *   <li>Data Episode id</li>
	    * </ul>
	    * 
	    * @param seriesId unique identifer of the series
	    * @param request the http request
	    * @param response the http reponse.
	    * @throws IOException If there is an issue reaching TheTvDB
	    */
	   
	   @RequestMapping(value="/all/{seriesId}", method = RequestMethod.GET)
	   public void getAllSeriesDetails(
			   @PathVariable String seriesId,
			   HttpServletRequest request, HttpServletResponse response) throws IOException {

		   response.setContentType(request.getContentType());
		   URL url = new URL("http://thetvdb.com/api/" + showInformation.getApiKey()
				   + "/series/" + URLEncoder.encode(seriesId,"UTF-8") + "/all/en.xml");
		   URLConnection connection = url.openConnection();
		   connection.connect();
		   response.setContentType(connection.getContentType());
		   
		   // Handle Cache Headers
		   String lastModifiedHeader = connection.getHeaderField("Last-Modified");
		   String expiresHeader = connection.getHeaderField("Expires");
		   String cacheControlHeader = connection.getHeaderField("Cache-Control");
		   if(lastModifiedHeader != null) {
	   		   response.addHeader("Last-Modified", lastModifiedHeader);
   		   }
   		   if(expiresHeader != null) {
			   response.addHeader("Expires", expiresHeader);
   		   }
   		   if(cacheControlHeader != null) {
			   response.addHeader("Cache-Control", cacheControlHeader);
   		   }
		   	       
	       BufferedReader inputReader = new BufferedReader(new InputStreamReader(url.openStream()));
	       PrintWriter printWriter = response.getWriter();
	       
	       String nextLine = inputReader.readLine();
	       while(nextLine != null) {
			   printWriter.println(stripNonValidXMLCharacters(nextLine));
		       nextLine = inputReader.readLine();
	       }
	       
		   
		   printWriter.flush();
		   printWriter.close();

	   }

	@RequestMapping(value="/banners/**", method = {RequestMethod.GET,RequestMethod.HEAD})
	public void getAllSeriesDetails(
			HttpServletRequest request, HttpServletResponse response) throws IOException {

		String path = (String) request.getAttribute(
			HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
		path = path.replaceAll("/api", "http://thetvdb.com");
		String method = request.getMethod(); 
		URL url = new URL(path);
		HttpURLConnection connection = (HttpURLConnection) url.openConnection();
		connection.setRequestMethod(method);
		connection.connect();
		String contentType = connection.getContentType();

		String ifNoneMatch = request.getHeader("If-None-Match");
		
		log.info("Request to banners API has If-None-Match: " + ifNoneMatch + " and contentType: " + contentType);
		// If there is a "If None Match" header, than it was etagged, so just
		// tell it not modified.  If we try and pull it and the result comes
		// as text/html, something has gone wrong.  error 500 or something,
		// so we need to do some clever.
		if(ifNoneMatch == null && contentType.contains("text/html")) {
			log.info("Streaming null image because of If-None-Match and content type");
		    streamNoImage(response);						
		} else if (ifNoneMatch == null) {
			try {
				response.setContentType(contentType);
				
				// Just set a cache header to expire in 1 - year
				response.addHeader("Cache-Control", "public, max-age=31556926");
				response.addHeader("ETag", Integer.toString(path.hashCode()));
				
				BufferedInputStream reader = new BufferedInputStream(url.openStream());
				BufferedOutputStream writer = new BufferedOutputStream(response.getOutputStream());
				
				byte[] buffer = new byte[1024];
				int len;
				while ((len = reader.read(buffer)) != -1) {
					writer.write(buffer, 0, len);
				}
				   
				writer.flush();
				writer.close();
			} catch (Exception e) {
				log.log(Level.INFO, "Streaming null image because of Exception",e);
				streamNoImage(response);
			}
		} else {
			// Just set a cache header to expire in 1 - year
			response.addHeader("Cache-Control", "public, max-age=31556926");
			response.addHeader("ETag", Integer.toString(path.hashCode()));
			response.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
		}
	}
	
	protected void streamNoImage(HttpServletResponse response) throws IOException {
		response.setContentType("image/png");
		response.addHeader("Pragma", "no-cache");
		response.addHeader("Cache-Control", "no-cache, must-revalidate");

		InputStream inputStream = ProxyController.class.getResourceAsStream("/resources/img/noimage.png");
		BufferedInputStream reader = new BufferedInputStream(inputStream);
		BufferedOutputStream writer = new BufferedOutputStream(response.getOutputStream());
		
		byte[] buffer = new byte[1024];
		int len;
		while ((len = reader.read(buffer)) != -1) {
			writer.write(buffer, 0, len);
		}
		   
		writer.flush();
		writer.close();					
	}

    /**
     * This method ensures that the output String has only
     * valid XML unicode characters as specified by the
     * XML 1.0 standard. For reference, please see
     * <a href="http://www.w3.org/TR/2000/REC-xml-20001006#NT-Char">the
     * standard</a>. This method will return an empty
     * String if the input is null or empty.
     *
     * @param in The String whose non-valid characters we want to remove.
     * @return The in String, stripped of non-valid characters.
     */
    public String stripNonValidXMLCharacters(String in) {
        StringBuffer out = new StringBuffer(); // Used to hold the output.
        char current; // Used to reference the current character.

        if (in == null || ("".equals(in))) return ""; // vacancy test.
        for (int i = 0; i < in.length(); i++) {
            current = in.charAt(i); // NOTE: No IndexOutOfBoundsException caught here; it should not happen.
            if ((current == 0x9) ||
                (current == 0xA) ||
                (current == 0xD) ||
                ((current >= 0x20) && (current <= 0xD7FF)) ||
                ((current >= 0xE000) && (current <= 0xFFFD)) ||
                ((current >= 0x10000) && (current <= 0x10FFFF)))
                out.append(current);
        }
        return out.toString();
    }    
	
   @RequestMapping(value="/headertest", method = RequestMethod.GET)
   public void headersProxy(
		   HttpServletRequest request, HttpServletResponse response) throws IOException {

	   response.setContentType(request.getContentType());
	   URL url = new URL("https://home.chaosserver.net:8443/headers.php");
	   URLConnection connection = url.openConnection();
	   connection.setRequestProperty("User-Agent","Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/536.30.1 (KHTML, like Gecko) Version/6.0.5 Safari/536.30.1");
	   connection.connect();
	   response.setContentType(connection.getContentType());
	   	   
	   BufferedInputStream reader = new BufferedInputStream(url.openStream());
	   BufferedOutputStream writer =
	            new BufferedOutputStream(response.getOutputStream());
       
	   
	   byte[] buffer = new byte[1024];
	   int len;
	   while ((len = reader.read(buffer)) != -1) {
		   writer.write(buffer, 0, len);
	   }
	   
	   // writer.write(method.getResponseBodyAsString());
       writer.flush();
       writer.close();
   }
	
}
