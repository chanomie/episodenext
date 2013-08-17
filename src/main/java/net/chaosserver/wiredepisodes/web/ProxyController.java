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
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.HttpURLConnection;
import java.net.URLEncoder;

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
	   @Autowired
	   private ShowInformation showInformation;

	   @RequestMapping(value="/getseries")
	   public void searchForSeries(
			   @RequestParam(required = true, value = "seriesname") String seriesname,
			   HttpServletRequest request, HttpServletResponse response) throws IOException {

		   response.addHeader("Access-Control-Allow-Origin", "*");
		   response.addHeader("Access-Control-Allow-Methods", "POST, GET");
		   URL url = new URL("http://thetvdb.com/api/GetSeries.php?seriesname=" + URLEncoder.encode(seriesname));
		   URLConnection connection = url.openConnection();
		   connection.connect();
		   response.setContentType(connection.getContentType());
   		   response.addHeader("Last-Modified", connection.getHeaderField("Last-Modified"));
		   response.addHeader("Expires", connection.getHeaderField("Expires"));
		   response.addHeader("Cache-Control", connection.getHeaderField("Cache-Control"));
		   
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
		   response.addHeader("Access-Control-Allow-Origin", "*");
		   response.addHeader("Access-Control-Allow-Methods", "POST, GET");
		   URL url = new URL("http://thetvdb.com/api/" + showInformation.getApiKey()
				   + "/series/" + URLEncoder.encode(seriesId) + "/en.xml");
		   URLConnection connection = url.openConnection();
		   connection.connect();
		   response.setContentType(connection.getContentType());
   		   response.addHeader("Last-Modified", connection.getHeaderField("Last-Modified"));
		   response.addHeader("Expires", connection.getHeaderField("Expires"));
		   response.addHeader("Cache-Control", connection.getHeaderField("Cache-Control"));
		   
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
		   response.addHeader("Access-Control-Allow-Origin", "*");
		   response.addHeader("Access-Control-Allow-Methods", "POST, GET");
		   URL url = new URL("http://thetvdb.com/api/" + showInformation.getApiKey()
				   + "/series/" + URLEncoder.encode(seriesId) + "/all/en.xml");
		   URLConnection connection = url.openConnection();
		   connection.connect();
		   response.setContentType(connection.getContentType());
   		   response.addHeader("Last-Modified", connection.getHeaderField("Last-Modified"));
		   response.addHeader("Expires", connection.getHeaderField("Expires"));
		   response.addHeader("Cache-Control", connection.getHeaderField("Cache-Control"));
		   
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
            
           String method = request.getMethod(); 
           path = path.replaceAll("/api", "http://thetvdb.com");
		   URL url = new URL(path);
		   HttpURLConnection connection = (HttpURLConnection) url.openConnection();
		   connection.setRequestMethod(method);
		   connection.connect();
		   response.setContentType(connection.getContentType());
   		   response.addHeader("Last-Modified", connection.getHeaderField("Last-Modified"));
		   response.addHeader("Expires", connection.getHeaderField("Expires"));
		   response.addHeader("Cache-Control", connection.getHeaderField("Cache-Control"));

		   
		   BufferedInputStream reader = new BufferedInputStream(url.openStream());
		   BufferedOutputStream writer =
		            new BufferedOutputStream(response.getOutputStream());
	       
		   
		   byte[] buffer = new byte[1024];
		   int len;
		   while ((len = reader.read(buffer)) != -1) {
			   writer.write(buffer, 0, len);
		   }
		   
	       writer.flush();
	       writer.close();
	   }
	   
	   
	   
}
