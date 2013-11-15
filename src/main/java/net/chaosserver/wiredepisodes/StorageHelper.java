package net.chaosserver.wiredepisodes;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.logging.Logger;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;

public class StorageHelper {
	private static final Logger log = Logger.getLogger(StorageHelper.class
			.getName());
	protected static DatastoreService datastore = DatastoreServiceFactory
			.getDatastoreService();

	/**
	 * Gets the Key for the Principal object from the Person Datastore. If the
	 * principal doesn't existing in the Person datastore it is created as part
	 * of this request.
	 */
	public static Key getPrincipalKey(Principal principal) {
		log.fine("Looking up key for principal: " + principal.getName());
		Query q = new Query("Person");
		Key principalKey = KeyFactory.createKey("Person", principal.getName());
		q.setFilter(FilterOperator.EQUAL.of(Entity.KEY_RESERVED_PROPERTY,
				principalKey));
		q.setKeysOnly();
		PreparedQuery pq = datastore.prepare(q);
		Entity resultEntity = pq.asSingleEntity();

		if (resultEntity == null) {
			log.info("Principal not found, creating: " + principal.getName());
			resultEntity = new Entity("Person", principal.getName());
			datastore.put(resultEntity);
			log.info("Entity created: " + resultEntity.getKey());
		} else {
			log.info("Entity found: " + resultEntity.getKey());
		}
		return resultEntity.getKey();
	}
	
	/**
	 * Gets the list of watched episode keys for the user principal
	 * 
	 * @param principalKey the key for the princiap
	 * @param updated only return keys updated since date
	 * @return
	 */
	public static List<Map<String, String>> getWatchedEpisodes(
			Key principalKey, Date updated) {
		List<Map<String, String>> watchedEpisodeList = new ArrayList<Map<String, String>>();

		Query q = new Query("WatchedEpisodes");
		q.setAncestor(principalKey);
		if (updated != null) {
			Filter lastUpdatedFilter = new Query.FilterPredicate("updated",
					FilterOperator.GREATER_THAN_OR_EQUAL, updated);
			q.setFilter(lastUpdatedFilter);
		}

		PreparedQuery pq = datastore.prepare(q);
		for (Entity result : pq.asIterable()) {
			watchedEpisodeList.add(convertEntityToStringMap(result));
		}

		return watchedEpisodeList;
	}
	
	/**
	 * Gets the list of watched episode keys for the user principal
	 * 
	 * @param principalKey the key for the princiap
	 * @param updated only return keys updated since date
	 * @return
	 */
	public static Set<String> getWatchedEpisodesKeys(
			Key principalKey, Date updated) {
		
		Set<String> watchedEpisodeKeys = new HashSet<String>();

		Query q = new Query("WatchedEpisodes");
		q.setAncestor(principalKey);
		if (updated != null) {
			Filter lastUpdatedFilter = new Query.FilterPredicate("updated",
					FilterOperator.GREATER_THAN_OR_EQUAL, updated);
			q.setFilter(lastUpdatedFilter);
		}

		PreparedQuery pq = datastore.prepare(q);
		for (Entity result : pq.asIterable()) {
			if(result.hasProperty("watchedKey")) {
				Object watchedKey = result.getProperty("watchedKey");
				if(watchedKey instanceof String) {
					watchedEpisodeKeys.add((String)watchedKey);
				}
			}
		}

		return watchedEpisodeKeys;
	}


	/**
	 * Converts a Google Datastore Entity into a Map<String,String> for easily
	 * converting back to JSON on return.
	 * 
	 * @param entity
	 *            entity to convert
	 * @return the entity converted into string-based key/value pairs.
	 */
	public static Map<String, String> convertEntityToStringMap(Entity entity) {
		Map<String, String> propertyStringMap = new HashMap<String, String>();
		for (Entry<String, Object> propertyMap : entity.getProperties()
				.entrySet()) {
			String key = propertyMap.getKey();
			String value = propertyMap.getValue().toString();
			if (propertyMap.getValue() instanceof Date) {
				value = String.valueOf(((Date) propertyMap.getValue())
						.getTime());
			}
			propertyStringMap.put(key, value);
		}
		return propertyStringMap;
	}

}
