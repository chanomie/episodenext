package net.chaosserver.wiredepisodes;

import static org.junit.Assert.assertNotNull;

import org.junit.Test;

import com.omertron.thetvdbapi.model.Episode;

public class ShowInformationTest {
	 @Test
	 public void testGetShow() {
		 ShowInformation showInformation = new ShowInformation();

		 Episode episode = showInformation.getEpisode("80379", 1, 1);
		 System.out.println(episode);
		 assertNotNull(episode);
	 }
}
