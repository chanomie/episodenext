package net.chaosserver.wiredepisodes;

import java.util.Collections;
import java.util.Set;
import java.util.logging.Logger;
import java.util.logging.Level;

import javax.cache.Cache;
import javax.cache.CacheException;
import javax.cache.CacheFactory;
import javax.cache.CacheManager;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.images.Image;
import com.google.appengine.api.images.ImagesService;
import com.google.appengine.api.images.ImagesServiceFactory;
import com.google.appengine.api.images.OutputSettings;
import com.google.appengine.api.images.Transform;
import com.google.appengine.api.memcache.MemcacheServiceException;

/**
 * Manages all of the caches associated with the system.  This is using
 * the Java Cache API, but that uses Google MemCache under the covers inside
 * of app engine.
 * 
 * @author jreed
 *
 */
public class WatchedEpisodeCache {
	/** Logger. */
	private static final Logger log = Logger.getLogger(WatchedEpisodeCache.class
			.getName());

	/** Reference to the Image Service used to resize overly large images. */
	ImagesService imagesService;
	
	/** Cache of all the watched keys. */
	Cache watchedKeysCache;
	
	/** Cache of all the series banner images. */
	Cache seriesImageCache;
	
	/** Cache of all the XML API calls to TheTVDB. */
	Cache apiCache;
	
	/**
	 * Constructor initializes all of the internal objects.
	 * 
	 * @throws CacheException
	 */
	public WatchedEpisodeCache() throws CacheException {
		CacheFactory cacheFactory = CacheManager.getInstance().getCacheFactory();
		watchedKeysCache = cacheFactory.createCache(Collections.emptyMap());
		seriesImageCache = cacheFactory.createCache(Collections.emptyMap());
		apiCache = cacheFactory.createCache(Collections.emptyMap());
		imagesService = ImagesServiceFactory.getImagesService();
	}

	public Set<String> getWatchedEpisodesKeys(Key principalKey) {
		return (Set<String>) watchedKeysCache.get(principalKey);
	}

	public void putWatchedEpisodesKeys(Key principalKey,
			Set<String> watchedEpisodeSet) {
		
		watchedKeysCache.put(principalKey, watchedEpisodeSet);
	}
	
	public byte[] getApiResponse(String path) {
		return (byte[]) apiCache.get(path);
	}
	
	public void putApiResponse(String path, byte[] response) {
		watchedKeysCache.put(path, response);
	}

	public byte[] getEpisodeImage(String path) {
		return (byte[]) seriesImageCache.get(path);
	}
	
	public void putEpisodeImage(String path, byte[] image) {
		int quality = 90;
		int imageLength = image.length;
		byte[] imageToCache = image;
		
		while(imageLength >= 1000000 && quality > 0) {
			OutputSettings settings = new OutputSettings(ImagesService.OutputEncoding.JPEG);
			Image oldImage = ImagesServiceFactory.makeImage(image);
			Transform transform = ImagesServiceFactory.makeResize(oldImage.getWidth(), oldImage.getHeight());
			settings.setQuality(quality);
			Image newImage = imagesService.applyTransform(transform, oldImage, settings);
			imageToCache = newImage.getImageData();
			imageLength = imageToCache.length;
			quality =- 10;
		}
		
		try {
			seriesImageCache.put(path, imageToCache);
		} catch (MemcacheServiceException e) {
			log.log(Level.WARNING, "Failed to put into cache", (Throwable) e);
		}		
	}
}
