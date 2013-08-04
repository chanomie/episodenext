package net.chaosserver.wiredepisodes.web;

import javax.servlet.http.HttpServletRequest;

import net.chaosserver.wiredepisodes.ShowInformation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import com.omertron.thetvdbapi.model.Episode;
import com.omertron.thetvdbapi.model.Series;

@Controller
@RequestMapping(value="/showdetails")
public class EpisodeController {
   @Autowired
   private ShowInformation showInformation;

   @RequestMapping(method = RequestMethod.GET)
   public String get() {
       return "episode/view";
   }
   
   @RequestMapping(value="/{seriesId}", method = RequestMethod.GET)
   public String getSeriesDetails(
		   @PathVariable String seriesId,
		   @RequestParam(value="ignoreUA", required=false) String ignoreUA,
		   @RequestHeader("User-Agent") String userAgent,
		   Model model) {
	   
	   String resultView = "episodes/error404";
	   try {
		   Series series = showInformation.getSeries(seriesId);
		   model.addAttribute("series", series);
	   		   
		   if(series != null) {
			   if("facebookexternalhit".equals(userAgent) || Boolean.parseBoolean(ignoreUA)) {
				   resultView = "series/view";
			   } else {
				   resultView = "redirect:" + showInformation.getSeriesUrl(series);;
			   }
		   }
	   } catch (NumberFormatException e) {
		   resultView = "episodes/error404";
	   }
	   
	   return resultView;
   }
   
   @RequestMapping(value="/{seriesId}/{seasonNumber}/{episodeNumber}", method = RequestMethod.GET)
   public String getEpisodeDetails(
		   @PathVariable String seriesId, 
		   @PathVariable String seasonNumber, 
		   @PathVariable String episodeNumber,
		   @RequestParam(value="ignoreUA", required=false) String ignoreUA,
		   @RequestHeader("User-Agent") String userAgent,
		   Model model) {
	
	   String resultView = "episodes/error404";
	   
	   try {
		   Series series = showInformation.getSeries(seriesId);
		   model.addAttribute("series", series);
	   
		   Episode episode = showInformation.getEpisode(seriesId, Integer.parseInt(seasonNumber), Integer.parseInt(episodeNumber));
		   model.addAttribute("episode", episode);
		   
		   if(series != null && episode != null) {
			   if("facebookexternalhit".equals(userAgent) || Boolean.parseBoolean(ignoreUA)) {
				   resultView = "episode/view";
			   } else {
				   resultView = "redirect:" + showInformation.getEpisodeUrl(episode);
			   }
		   }
	   } catch (NumberFormatException e) {
		   resultView = "episodes/error404";
	   }
	   
	   return resultView;
	}
}
