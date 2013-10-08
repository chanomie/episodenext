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

import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.api.users.UserService;

import java.io.InputStream;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.HttpURLConnection;
import java.net.URLEncoder;
import java.security.Principal;
import java.util.Map;
import java.util.HashMap;

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
import org.springframework.web.bind.annotation.ResponseBody;
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

		   URL url = new URL("http://thetvdb.com/api/GetSeries.php?seriesname=" + URLEncoder.encode(seriesname));
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
	   
	   @RequestMapping(value="/{seriesId}", method = { RequestMethod.GET })
	   public void getSeriesDetails(
			   @PathVariable String seriesId,
			   HttpServletRequest request, HttpServletResponse response) throws IOException {

		   response.setContentType(request.getContentType());
		   URL url = new URL("http://thetvdb.com/api/" + showInformation.getApiKey()
				   + "/series/" + URLEncoder.encode(seriesId) + "/en.xml");
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

	   
	   @RequestMapping(value="/all/{seriesId}", method = RequestMethod.GET)
	   public void getAllSeriesDetails(
			   @PathVariable String seriesId,
			   HttpServletRequest request, HttpServletResponse response) throws IOException {

		   response.setContentType(request.getContentType());
		   URL url = new URL("http://thetvdb.com/api/" + showInformation.getApiKey()
				   + "/series/" + URLEncoder.encode(seriesId) + "/all/en.xml");
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

	@RequestMapping(value="/banners/**", method = {RequestMethod.GET,RequestMethod.HEAD})
	public void getAllSeriesDetails(
			HttpServletRequest request, HttpServletResponse response) throws IOException {

		String path = (String) request.getAttribute(
			HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
		path = path.replaceAll("/api", "http://thetvdb.com");
		String method = request.getMethod(); 
		URL url = new URL(path);
		HttpURLConnection connection = (HttpURLConnection) url.openConnection();
		String contentType = connection.getContentType();

		String ifNoneMatch = request.getHeader("If-None-Match");
		// If there is a "If None Match" header, than it was etagged, so just
		// tell it not modified.  If we try and pull it and the result comes
		// as text/html, something has gone wrong.  error 500 or something,
		// so we need to do some clever.
		if(ifNoneMatch == null && contentType.contains("text/html")) {
		    streamNoImage(response);						
		} else if (ifNoneMatch == null) {
			try {
				connection.setRequestMethod(method);
				connection.connect();
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
}
