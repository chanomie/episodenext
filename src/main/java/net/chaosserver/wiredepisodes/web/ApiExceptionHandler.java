package net.chaosserver.wiredepisodes.web;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.json.MappingJacksonJsonView;

/**
 * The exception resolve is used to catch exceptions thrown by the controllers
 * and respond with a JSON error message.
 *  
 * @author jreed
 *
 */
@Component("ExceptionResolver")
public class ApiExceptionHandler implements HandlerExceptionResolver {
	private static final Logger log = Logger.getLogger(ApiExceptionHandler.class.getName());
	
	@Override
	public ModelAndView resolveException(HttpServletRequest request,
			HttpServletResponse response, Object handler, Exception e) {

	    ModelAndView mav = new ModelAndView();
	    mav.setView(new MappingJacksonJsonView());
	    mav.addObject("errorType", e.getClass().getName());
	    mav.addObject("errorMessage", e.getMessage());

		log.info("Caught Exception: " + e);
		if(e instanceof SecurityException) {
		    response.setStatus(403);
		} else if (e instanceof IllegalArgumentException) { 
			response.setStatus(400);
		} else {
			response.setStatus(500);
		}
	    return mav;
	}
}
