package net.chaosserver.wiredepisodes.web;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.api.datastore.KeyFactory;

/**
 * The storage controller is used to manage storage of information inside of
 * Google App Engine.  It provides APIs that can be used to read/write/delete
 * the contents of Google App Engine.
 * 
 * It is assumed the the user must be authenticated against the J2EE context
 * to call the various methods.
 * 
 * @author jreed
  */
@Controller
@RequestMapping(value="/api")
public class StorageController {
       private static final Logger log = Logger.getLogger(StorageController.class.getName());
	   DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
	   
	   /** 
	    * Create a warmpup API inside of the Spring Framework.
	    * 
	    * Google App Engine will take the app out of memory if nothing is hitting it, which
	    * causes the first request to the app to take 30+ seconds.  To try and mitigate this problem
	    * the warmup API is called directly to by the HTML on load.
	    * 
	    * @return
	    */
	   @RequestMapping(value="/v1/warmup", produces = "text/css")
	   public String warmpup(HttpServletResponse response) {
		   response.setContentType("text/css");
		   response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
		   response.setHeader("Pragma", "no-cache"); // HTTP 1.0.
		   response.setDateHeader("Expires", 0); // Proxies.
		   return "warmup";
	   }
	   
	   
	   /**
	    * This method is used to determine the authentication status of the user.  It will
	    * also return the paths for the login and logout URL
	    * 
	    * @param request the httprequest object
	    * @param response the httpresponse object
	    * @param principal the principal object for the J2EE context
	    * @param returnPath a URL where the user should be returned after logging in
	    *        or logging out.  it will be appended to the login/logout URL
	    * @return a JSON object providing login status and URLs for the login/logout URL
	    */
	   @RequestMapping(value="/v1/google/status")
		public @ResponseBody Map<String,String> getGoogleStatus(
				HttpServletRequest request, 
				HttpServletResponse response,
				Principal principal,
				@RequestParam(value="returnPath", required=false) String returnPath
			) {

	       String thisURL = returnPath != null ? returnPath : request.getRequestURI();
	       UserService userService = UserServiceFactory.getUserService();
	       
	       Map<String,String> urlMap = new HashMap<String,String>();
	       urlMap.put("googleLogoutUrl", userService.createLogoutURL(thisURL));
	       urlMap.put("googleLoginUrl", userService.createLoginURL(thisURL));
	       if(principal != null) {
		       urlMap.put("googleLoginStatus", "true");       
	       } else {
		       urlMap.put("googleLoginStatus", "false");
	       }
	       
	       return urlMap;
	   }

	   /**
	    * Gets the list of all series for the current user.
	    * 
	    * @param request http request
	    * @param response http response
	    * @param principal principal
	    * @return A JSON object of the subscribed series
	    */
	   @RequestMapping(value="/v1/data/series", method = { RequestMethod.GET })
	   public @ResponseBody List<Map<String,String>> getSeries(
	           HttpServletRequest request, 
			   HttpServletResponse response,
			   Principal principal) {
		   
		   
		   if(principal == null) throw new SecurityException("Requires user principal");
		   Query q = new Query("SeriesList");
		   q.setAncestor(getPrincipalKey(principal));
	       
	       List<Map<String,String>> seriesList = new ArrayList<Map<String,String>>(); 
	       PreparedQuery pq = datastore.prepare(q);
	       for (Entity result : pq.asIterable()) {
	    	   seriesList.add(convertEntityToStringMap(result));
   	        }
	       
		   return seriesList;
	   }

	   @RequestMapping(value="/v1/data/series", method = { RequestMethod.POST })
	   public @ResponseBody Map<String,String> createSeries(
	           HttpServletRequest request, 
			   HttpServletResponse response,
			   @RequestParam(value="seriesId", required=false) String seriesId,
			   @RequestParam(value="updated", required=false) String updated,
			   Principal principal) {
		   
		   
		   // java currenttime:      1377823302071
		   // javascript currentime: 1377061514516

		   if(principal == null) throw new SecurityException("Requires user principal");
		   if(seriesId == null) throw new IllegalArgumentException("Missing series Id");
		   
		   Date updatedTime = new Date();
		   try {
			   updatedTime = new Date(Long.parseLong(updated));
		   } catch (Exception e) {
			   // do nothing
		   }

		   Entity series = new Entity("SeriesList", seriesId, getPrincipalKey(principal));
		   series.setProperty("seriesId", seriesId);
		   series.setProperty("updated", updatedTime);
		   datastore.put(series);
			   
		   return convertEntityToStringMap(series);
	   }

	   @RequestMapping(value="/v1/data/series/{seriesId}", method = { RequestMethod.DELETE })
	   public @ResponseBody List<Map<String,String>> deleteSeries(
	           HttpServletRequest request, 
			   HttpServletResponse response,
			   @PathVariable String seriesId,
			   Principal principal) {
		   
		   
		   if(principal == null) throw new SecurityException("Requires user principal");
		   
		   Query q = new Query("SeriesList");
		   Key seriesListKey = KeyFactory.createKey(getPrincipalKey(principal), "SeriesList", seriesId);
		   q.setFilter(FilterOperator.EQUAL.of(Entity.KEY_RESERVED_PROPERTY, seriesListKey));
		   q.setAncestor(getPrincipalKey(principal));
		       
	       List<Map<String,String>> seriesList = new ArrayList<Map<String,String>>(); 
	       PreparedQuery pq = datastore.prepare(q);
	       for (Entity result : pq.asIterable()) {
	    	   seriesList.add(convertEntityToStringMap(result));
	    	   datastore.delete(result.getKey());
   	        }
		       
		   return seriesList;
	   }

	   
	   /**
	    * Gets the list of all watched series for the current user.
	    * 
	    * @param request http request
	    * @param response http response
	    * @param principal principal
	    * @return A JSON object of the subscribed series
	    */
	   @RequestMapping(value="/v1/data/watched", method = { RequestMethod.GET })
	   public @ResponseBody List<Map<String,String>> getWatched(
	           HttpServletRequest request, 
			   HttpServletResponse response,
			   Principal principal) {
		   
		   
		   if(principal == null) throw new SecurityException("Requires user principal");
		   Query q = new Query("WatchedEpisodes");
		   q.setAncestor(getPrincipalKey(principal));
	       
	       List<Map<String,String>> watchedEpisodeList = new ArrayList<Map<String,String>>(); 
	       PreparedQuery pq = datastore.prepare(q);
	       for (Entity result : pq.asIterable()) {
	    	   watchedEpisodeList.add(convertEntityToStringMap(result));
   	        }
	       
		   return watchedEpisodeList;
	   }

	   @RequestMapping(value="/v1/data/watched", method = { RequestMethod.POST })
	   public @ResponseBody Map<String,String> addWatchedEpisode(
	           HttpServletRequest request, 
			   HttpServletResponse response,
			   @RequestParam(value="watchedKey", required=false) String seriesId,
			   @RequestParam(value="updated", required=false) String updated,
			   Principal principal) {
		   
		   
		   // java currenttime:      1377823302071
		   // javascript currentime: 1377061514516

		   if(principal == null) throw new SecurityException("Requires user principal");
		   if(seriesId == null) throw new IllegalArgumentException("Missing series Id");
		   
		   Date updatedTime = new Date();
		   try {
			   updatedTime = new Date(Long.parseLong(updated));
		   } catch (Exception e) {
			   // do nothing
		   }

		   Entity watchedEpisode = new Entity("WatchedEpisodes", seriesId, getPrincipalKey(principal));
		   watchedEpisode.setProperty("watchedKey", seriesId);
		   watchedEpisode.setProperty("updated", updatedTime);
		   datastore.put(watchedEpisode);
			   
		   return convertEntityToStringMap(watchedEpisode);
	   }

	   @RequestMapping(value="/v1/data/watched/{watchedKey}", method = { RequestMethod.DELETE })
	   public @ResponseBody List<Map<String,String>> deleteWatched(
	           HttpServletRequest request, 
			   HttpServletResponse response,
			   @PathVariable String watchedKey,
			   Principal principal) {
		   
		   
		   if(principal == null) throw new SecurityException("Requires user principal");
		   
		   Query q = new Query("WatchedEpisodes");
		   Key watchedEpisodeKey = KeyFactory.createKey(getPrincipalKey(principal), "WatchedEpisodes", watchedKey);
		   q.setFilter(FilterOperator.EQUAL.of(Entity.KEY_RESERVED_PROPERTY, watchedEpisodeKey));
		   q.setAncestor(getPrincipalKey(principal));
		       
	       List<Map<String,String>> watchedKeyList = new ArrayList<Map<String,String>>(); 
	       PreparedQuery pq = datastore.prepare(q);
	       for (Entity result : pq.asIterable()) {
	    	   watchedKeyList.add(convertEntityToStringMap(result));
	    	   datastore.delete(result.getKey());
   	        }
		       
		   return watchedKeyList;
	   }

	   /**
	    * Converts a Google Datastore Entity into a Map<String,String> for
	    * easily converting back to JSON on return.
	    * 
	    * @param entity entity to convert
	    * @return the entity converted into string-based key/value pairs.
	    */
	   protected Map<String,String> convertEntityToStringMap(Entity entity) {
    	   Map<String,String> propertyStringMap = new HashMap<String,String>();
    	   for(Entry<String, Object> propertyMap : entity.getProperties().entrySet()) {
    		   String key = propertyMap.getKey();
    		   String value = propertyMap.getValue().toString();
    		   if(propertyMap.getValue() instanceof Date) {
    			   value = String.valueOf(((Date)propertyMap.getValue()).getTime()); 
    		   }
    		   propertyStringMap.put(key, value);
    	   }
    	   return propertyStringMap;
	   }
	   
	   /**
	    * Gets the Key for the Principal object from the Person Datastore.
	    * If the principal doesn't existing in the Person datastore it is created
	    * as part of this request.
	    */
	   protected Key getPrincipalKey(Principal principal) {
		   log.fine("Looking up key for principal: " + principal.getName());
		   Query q = new Query("Person");
		   Key principalKey = KeyFactory.createKey("Person", principal.getName());
		   q.setFilter(FilterOperator.EQUAL.of(Entity.KEY_RESERVED_PROPERTY, principalKey));
		   q.setKeysOnly();
		   PreparedQuery pq = datastore.prepare(q);
		   Entity resultEntity = pq.asSingleEntity();
		   
		   if(resultEntity == null) {
			   log.info("Principal not found, creating: " + principal.getName());
			   resultEntity = new Entity("Person", principal.getName());
			   datastore.put(resultEntity);   
			   log.info("Entity created: " + resultEntity.getKey());
		   } else {
			   log.info("Entity found: " + resultEntity.getKey());
		   }
		   return resultEntity.getKey();
	   }
}
