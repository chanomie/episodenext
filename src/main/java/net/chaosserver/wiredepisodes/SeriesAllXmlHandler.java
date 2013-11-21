package net.chaosserver.wiredepisodes;

import java.io.PrintWriter;
import java.util.HashSet;
import java.util.Set;

import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

/**
 * Used to parse the series list returned from The TV DB and filter out the 
 * extraneous information.  This will filter to only include the XML Nodes that
 * are used by the front-end appliation.  Additionally you can include a Set
 * of keys marking watched Episodes and all those episodes will be removed
 * from the return set.
 * 
 * @author jreed
 */
public class SeriesAllXmlHandler extends DefaultHandler {
	/** Contains the list of Nodes to be included in the result. */
	protected static Set<String> nodeSet = new HashSet<String>();
	
	static {
		nodeSet.add("Data");
		nodeSet.add("Episode");
		nodeSet.add("Series");

		nodeSet.add("id");
		nodeSet.add("SeriesName");
		nodeSet.add("FirstAired");
		nodeSet.add("Overview");
		nodeSet.add("banner");
		nodeSet.add("EpisodeName");
		nodeSet.add("SeasonNumber");
		nodeSet.add("seasonid");
		nodeSet.add("EpisodeNumber");
		nodeSet.add("FirstAired");
		nodeSet.add("id");
	}

	/**
	 * Enumeration of the different parser states.
	 */
	protected enum ParseState {
		NONE,
	    DATA,
	    SERIES,
	    SERIES_ID,
	    EPISODE,
	    EPISODE_ID
	}
	
	/** Holds the last valid Tag Name to identify if the character stream should be saved. */
	protected String lastValidTagName;
	
	/** The output writer where the output goes. */
	protected PrintWriter outputWriter;
	
	/** The list of episodes to Exclude. */
	protected Set<String> excludeEpisodes;
	
	/** Buffer for the Episode XML that may or may not be written out. */
	protected StringBuffer episodeXml = new StringBuffer();
	
	/** The current seriesId being parsed. */
	protected String seriesId;
	
	/** The current episodeId being parsed. */
	protected String episodeId;
	
	/** The current parser state. */
	protected ParseState parseState = ParseState.NONE;
	
	/**
	 * Creates the Handler
	 * @param outputWriter writer where the output will go
	 */
	public SeriesAllXmlHandler(PrintWriter outputWriter) {
		this.outputWriter = outputWriter;
	}
	
	/**
	 * Creates the Handler.
	 * @param outputWriter writer where the output will go
	 * @param excludeEpisodes set of excluded Episode key
	 */
	public SeriesAllXmlHandler(PrintWriter outputWriter, Set<String> excludeEpisodes) {
		this(outputWriter);
		this.excludeEpisodes = excludeEpisodes;
	}
	
	public void startElement(String uri, String localName,String qName, 
            Attributes attributes) throws SAXException {
		
		// System.out.println("startElement qName [" + qName + "], ParseState = [" + parseState + "]");
		
		if(nodeSet.contains(qName)) {
			if("Data".equals(qName)) {
				parseState = ParseState.DATA;
			} else if ("Series".equals(qName)) {
				parseState = ParseState.SERIES;
			} else if ("Episode".equals(qName)) {
				parseState = ParseState.EPISODE;
			} else if("id".equals(qName)) {
				if(parseState == ParseState.SERIES) {
					parseState = ParseState.SERIES_ID;
				} else if(parseState == ParseState.EPISODE) {
					parseState = ParseState.EPISODE_ID;
				}
			}
			
			if(parseState == ParseState.EPISODE || parseState == ParseState.EPISODE_ID) {
				episodeXml.append("<"+qName+">");
			} else {
				outputWriter.write("<"+qName+">");
			}
			lastValidTagName = qName;
		} else {
			lastValidTagName = null;
		}
	}
	
	public void endElement(String uri, String localName,
			String qName) throws SAXException {
	 
		// System.out.println("endElement qName [" + qName + "], ParseState = [" + parseState + "]");
		if(nodeSet.contains(qName)) {
			if("Data".equals(qName)) {
				outputWriter.write("</"+qName+">");
				parseState = ParseState.NONE;
			} else if ("Series".equals(qName)) {
				outputWriter.write("</"+qName+">");
				parseState = ParseState.DATA;
			} else if ("Episode".equals(qName)) {
				episodeXml.append("</"+qName+">");
				String fullEpisodeKey = seriesId + "-" + episodeId;
				if(excludeEpisodes != null && excludeEpisodes.contains(fullEpisodeKey)) {
					episodeXml = new StringBuffer();
					episodeId = null;
					parseState = ParseState.DATA;
				} else {
					outputWriter.write(episodeXml.toString());
					episodeXml = new StringBuffer();
					episodeId = null;
					parseState = ParseState.DATA;
				}
			} else if("id".equals(qName)) {
				if(parseState == ParseState.SERIES_ID) {
					outputWriter.write("</"+qName+">");
					parseState = ParseState.SERIES;
				} else if(parseState == ParseState.EPISODE_ID) {
					episodeXml.append("</"+qName+">");
					parseState = ParseState.EPISODE;
				}
			} else {
				if(parseState == ParseState.EPISODE || parseState == ParseState.EPISODE_ID) {
					episodeXml.append("</"+qName+">");
				} else {
					outputWriter.write("</"+qName+">");
				}
				
			}
		}
		lastValidTagName = null;
	}
	
	public void characters(char ch[], int start, int length) throws SAXException {
		if(lastValidTagName != null) {
			String value = stripNonValidXMLCharacters(new String(ch, start, length).trim());
			
			if(parseState == ParseState.NONE
					|| parseState == ParseState.DATA
					|| parseState == ParseState.SERIES) {

				outputWriter.write(value);
			} else if (parseState == ParseState.SERIES_ID) {
				seriesId = value;
				outputWriter.write(value);
			} else if (parseState == ParseState.EPISODE) {
				episodeXml.append(value);
			} else if (parseState == ParseState.EPISODE_ID) {
				episodeId = value;
				episodeXml.append(value);
			}
		}
	}
	
    /**
     * This method ensures that the output String has only
     * valid XML unicode characters as specified by the
     * XML 1.0 standard. For reference, please see
     * <a href="http://www.w3.org/TR/2000/REC-xml-20001006#NT-Char">the
     * standard</a>. This method will return an empty
     * String if the input is null or empty.
     *
     * @param in The String whose non-valid characters we want to remove.
     * @return The in String, stripped of non-valid characters.
     */
    public static String stripNonValidXMLCharacters(String in) {
        StringBuffer out = new StringBuffer(); // Used to hold the output.
        char current; // Used to reference the current character.

        if (in == null || ("".equals(in))) return ""; // vacancy test.
        for (int i = 0; i < in.length(); i++) {
            current = in.charAt(i); // NOTE: No IndexOutOfBoundsException caught here; it should not happen.
            if ((current == 0x9) ||
                (current == 0xA) ||
                (current == 0xD) ||
                ((current >= 0x20) && (current <= 0xD7FF)) ||
                ((current >= 0xE000) && (current <= 0xFFFD)) ||
                ((current >= 0x10000) && (current <= 0x10FFFF)))
                out.append(current);
        }
        return out.toString();
    } 	
}
