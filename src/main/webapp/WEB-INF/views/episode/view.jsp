<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:url value="/showdetails/${episode.seriesId}" var="seriesUrl" />
<c:url value="/showdetails/${episode.seriesId}/${seasonNumber}/${episodeNumber}" var="episodeUrl" />
<c:url value="http://thetvdb.com/" var="tvdbUrl">
	<c:param name="tab" value="episode"/>
	<c:param name="seriesid" value="${episode.seriesId}"/>
	<c:param name="seasonid" value="${episode.seasonId}"/>
	<c:param name="id" value="${episode.id}"/>
	<c:param name="lid" value="7"/>
</c:url>
<html>
 <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# video: http://ogp.me/ns/video#">
  <title><c:out value="${series.seriesName}"/> - Season <c:out value="${episode.seasonNumber}"/> - Episode <c:out value="${episode.episodeNumber}"/> - <c:out value="${episode.episodeName}"/></title>
  <meta property="fb:app_id"      content="132823190241236" /> 
  <meta property="og:type"        content="video.episode" /> 
  <meta property="video:series"   content="<c:out value="${seriesUrl}"/>" />
  <meta property="og:url"         content="<c:out value="${episodeUrl}"/>" /> 
  <meta property="og:title"       content="<c:out value="${episode.episodeName}"/>" /> 
  <meta property="og:image"       content="<c:out value="${episode.filename}"/>" /> 
  <meta property="og:description" content="<c:out value="${episode.overview}"/>" />
  <meta proptery="og:site_name"   content="TheTVDB.com" />
 </head>
 <body>
 	<h1><a href="<c:out value="${seriesUrl}"/>"><c:out value="${series.seriesName}"/></a> - Season <c:out value="${episode.seasonNumber}"/> - Episode <c:out value="${episode.episodeNumber}"/> - <c:out value="${episode.episodeName}"/></h1>
 	<p><c:out value="${episode.overview}"/></p>
 	<p><a href="<c:out value="${tvdbUrl}" />">The TV DB</a>
 	<p><img src="<c:out value="${episode.filename}"/>" /></p>
 </body>
</html>
