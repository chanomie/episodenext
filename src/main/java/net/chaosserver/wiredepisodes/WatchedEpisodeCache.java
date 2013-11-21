package net.chaosserver.wiredepisodes;

import java.util.Collections;
import java.util.Set;

import javax.cache.Cache;
import javax.cache.CacheException;
import javax.cache.CacheFactory;
import javax.cache.CacheManager;

import com.google.appengine.api.datastore.Key;

public class WatchedEpisodeCache {
	Cache watchedKeysCache;
	
	public WatchedEpisodeCache() throws CacheException {
		CacheFactory cacheFactory = CacheManager.getInstance().getCacheFactory();
		watchedKeysCache = cacheFactory.createCache(Collections.emptyMap());
	}

	public Set<String> getWatchedEpisodesKeys(Key principalKey) {
		return (Set<String>) watchedKeysCache.get(principalKey);
	}

	public void putWatchedEpisodesKeys(Key principalKey,
			Set<String> watchedEpisodeSet) {
		
		watchedKeysCache.put(principalKey, watchedEpisodeSet);
	}
}
