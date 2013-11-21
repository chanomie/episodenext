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
	Cache seriesImageCache;
	
	public WatchedEpisodeCache() throws CacheException {
		CacheFactory cacheFactory = CacheManager.getInstance().getCacheFactory();
		watchedKeysCache = cacheFactory.createCache(Collections.emptyMap());
		seriesImageCache = cacheFactory.createCache(Collections.emptyMap());
	}

	public Set<String> getWatchedEpisodesKeys(Key principalKey) {
		return (Set<String>) watchedKeysCache.get(principalKey);
	}

	public void putWatchedEpisodesKeys(Key principalKey,
			Set<String> watchedEpisodeSet) {
		
		watchedKeysCache.put(principalKey, watchedEpisodeSet);
	}

	public byte[] getEpisodeImage(String path) {
		return (byte[]) seriesImageCache.get(path);
	}
	
	public void putEpisodeImage(String path, byte[] image) {
		// If it must be recached
		// compress & resize it
		/*
		OutputSettings settings = new OutputSettings(ImagesService.OutputEncoding.JPEG);
		settings.setQuality(90);
		Transform transform = ImagesServiceFactory.makeResize(newWidth, newHeight) 
		Image newImage = imagesService.applyTransform(transform, oldImage, settings);
		byte[] blobData = newImage.getImageData();
		*/
		
		seriesImageCache.put(path, image);
	}
}
