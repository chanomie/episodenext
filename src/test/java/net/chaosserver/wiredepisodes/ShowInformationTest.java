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
package net.chaosserver.wiredepisodes;

import static org.junit.Assert.assertNotNull;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

import org.junit.Test;

import com.omertron.thetvdbapi.model.Episode;

public class ShowInformationTest {
	 @Test
	 public void testGetShow() {
		 ShowInformation showInformation = new ShowInformation();
		 System.out.println("currenttime: " + System.currentTimeMillis());
		 System.out.println("currenttime: " + new Date(0));
		 
		 Episode episode = showInformation.getEpisode("80379", 1, 1);
		 System.out.println(episode);
		 assertNotNull(episode);
		 
	 }
}
