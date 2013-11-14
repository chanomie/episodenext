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

import java.net.URL;
import java.net.URLEncoder;

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
	 
	 @Test
	 public void testShowToXml() throws Exception {
		ShowInformation showInformation = new ShowInformation();
			 
		String seriesId = "251085";
		URL url = new URL("http://thetvdb.com/api/" + showInformation.getApiKey()
			+ "/series/" + URLEncoder.encode(seriesId) + "/all/en.xml");

		/*
		// 1. Instantiate a TransformerFactory.
		javax.xml.transform.TransformerFactory tFactory = 
		javax.xml.transform.TransformerFactory.newInstance();

		// 2. Use the TransformerFactory to process the stylesheet Source and
		//    generate a Transformer.
		javax.xml.transform.Transformer transformer = tFactory.newTransformer
                (new javax.xml.transform.stream.StreamSource("foo.xsl"));

		// 3. Use the Transformer to transform an XML Source and send the
		//    output to a Result object.
		transformer.transform
		(new javax.xml.transform.stream.StreamSource("foo.xml"), 
		new javax.xml.transform.stream.StreamResult( new
		java.io.FileOutputStream("foo.out")));
		 */
		// InputSource inputSource = new InputSource(url.openStream());
		// myReader.parse(inputSource); 
	 }
	 
}
