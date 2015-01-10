<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<c:set var="req" value="${pageContext.request}" />
<c:set var="baseURL" value="${fn:replace(req.requestURL, fn:substring(req.requestURI, 1, fn:length(req.requestURI)), req.contextPath)}" />

<c:url value="${baseURL}showdetails/${series.id}" var="seriesUrl" />
<c:url value="http://thetvdb.com/" var="tvdbUrl">
	<c:param name="tab" value="series"/>
	<c:param name="id" value="${series.id}"/>
	<c:param name="lid" value="7"/>
</c:url>
<html>
 <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# video: http://ogp.me/ns/video#">
  <title><c:out value="${series.seriesName}"/></title>
  <meta property="fb:app_id"      content="132823190241236" /> 
  <meta property="og:type"        content="video.tv_show" /> 
  <meta property="og:url"         content="<c:out value="${seriesUrl}"/>" /> 
  <meta property="og:title"       content="<c:out value="${series.seriesName}"/>" /> 
  <meta property="og:image"       content="<c:out value="${series.poster}"/>" /> 
  <meta property="og:description" content="<c:out value="${series.overview}"/>" />
  <meta proptery="og:site_name"   content="TheTVDB.com" />
 </head>
 <body>
 	<h1><c:out value="${series.seriesName}"/></h1>
 	<p><c:out value="${series.overview}"/></p>
 	<p><a href="<c:out value="${tvdbUrl}" />">The TV DB</a>
 	<p><img src="<c:out value="${series.poster}"/>" /></p>
 </body>
</html>