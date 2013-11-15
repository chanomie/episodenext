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

import java.io.PrintWriter;
import java.net.URL;
import java.net.URLEncoder;
import java.util.HashSet;
import java.util.Set;

import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import net.chaosserver.wiredepisodes.web.ProxyController;

import org.junit.Test;

public class ShowInformationTest {
	 /*
	 @Test
	 public void testGetShow() {
		 ShowInformation showInformation = new ShowInformation();
		 System.out.println("currenttime: " + System.currentTimeMillis());
		 System.out.println("currenttime: " + new Date(0));
		 
		 Episode episode = showInformation.getEpisode("80379", 1, 1);
		 System.out.println(episode);
		 assertNotNull(episode);
		 
	 }
	 */
	 
	/*
	 @Test
	 public void testShowToXml() throws Exception {
		ShowInformation showInformation = new ShowInformation();
			 
		String seriesId = "251085";
		URL url = new URL("http://thetvdb.com/api/" + showInformation.getApiKey()
			+ "/series/" + URLEncoder.encode(seriesId) + "/all/en.xml");

		// InputSource inputSource = new InputSource(url.openStream());
		// myReader.parse(inputSource); 
	 }
	*/
	
	@Test
	public void testSeriesAllParser() throws Exception {
		Set watchedSet = new HashSet<String>();
		watchedSet.add("251085-4639444");
		watchedSet.add("251085-4639445");
		watchedSet.add("251085-4639446");
		watchedSet.add("251085-4658840");
		watchedSet.add("251085-4310447");
		watchedSet.add("251085-4310448");
		watchedSet.add("251085-4310452");
		watchedSet.add("251085-4311547");
		watchedSet.add("251085-4315551");
		watchedSet.add("251085-4315552");
		watchedSet.add("251085-4315553");
		watchedSet.add("251085-4315554");
		watchedSet.add("251085-4315555");
		watchedSet.add("251085-4315556");
		watchedSet.add("251085-4315557");
		watchedSet.add("251085-4315558");
		watchedSet.add("251085-4618883");
		watchedSet.add("251085-4641101");
		watchedSet.add("251085-4641102");
		watchedSet.add("251085-4641103");
		watchedSet.add("251085-4644870");
		watchedSet.add("251085-4657085");
		watchedSet.add("251085-4657086");
		watchedSet.add("251085-4657087");
		watchedSet.add("251085-4657088");
		watchedSet.add("251085-4657089");
		watchedSet.add("251085-4657090");
		watchedSet.add("251085-4657091");
		watchedSet.add("251085-4657092");
		// watchedSet.add("251085-4657093");
		
		SAXParser saxParser = SAXParserFactory.newInstance().newSAXParser();
		PrintWriter printWriter = new PrintWriter(System.out);
		SeriesAllXmlHandler seriesAllXmlHandler = new SeriesAllXmlHandler(new PrintWriter(printWriter),watchedSet);
		saxParser.parse(ShowInformationTest.class.getResourceAsStream("/showdata.xml"),
				seriesAllXmlHandler);

		printWriter.flush();
	}
	

	 
}
