<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<c:set var="req" value="${pageContext.request}" />
<c:set var="baseURL" value="${fn:replace(req.requestURL, fn:substring(req.requestURI, 1, fn:length(req.requestURI)), req.contextPath)}" />
<c:url value="${baseURL}moviedetails/${movieId}" var="movieUrl" />
<c:url value="https://image.tmdb.org/t/p/w780${image}" var="imageUrl" />

<html>
 <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# video: http://ogp.me/ns/video#">
  <title><c:out value="${series.seriesName}"/> - Season <c:out value="${episode.seasonNumber}"/> - Episode <c:out value="${episode.episodeNumber}"/> - <c:out value="${episode.episodeName}"/></title>
  <meta property="fb:app_id"      content="132823190241236" /> 
  <meta property="og:type"        content="video.movie" /> 
  <meta property="og:url"         content="<c:out value="${movieUrl}"/>" /> 
  <meta property="og:title"       content="<c:out value="${title}"/>" /> 
  <meta property="og:image"       content="<c:out value="${imageUrl}"/>" /> 
  <meta property="og:description" content="<c:out value="${description}"/>" />
  <meta proptery="og:site_name"   content="TheMovieDB.com" />
 </head>
 <body>
 	<h1><a href="<c:out value="${movieUrl}"/>"><c:out value="${title}"/></a></h1>
 	<p><c:out value="${description}"/></p>
 	<p><a href="<c:out value="${moviedbUrl}" />">The Movie DB</a>
 	<p><img src="<c:out value="${imageUrl}"/>" /></p>
 </body>
</html>
