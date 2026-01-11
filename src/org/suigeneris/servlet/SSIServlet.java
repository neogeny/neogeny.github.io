
/**
 * Title:        suigeneris.org servlets
 * Description:
 * Copyright:    Copyright (c) 2000
 * Company:
 * @author Juanco Anez
 * @version 1.0
 */
package org.suigeneris.servlet;

import com.areane.www.ssi.*;

import javax.servlet.*;
import javax.servlet.http.*;
import java.net.URL;

public class SSIServlet extends HttpServlet {

  protected URLSSIParser _parser = new URLSSIParser();

  // process one request
  public void doGet( HttpServletRequest request, HttpServletResponse response )
  throws ServletException, java.io.IOException
  {
     Context context = new RequestContext( request );
     SsiPage page = getPage(request);
     if (page != null)
        page.write( response.getWriter(), context );
     else
        response.sendError(404, getResourcePath(request));
  }

  protected SsiPage getPage(HttpServletRequest request)
  throws java.io.IOException, ServletException
  {
     URL url = getPageURL(request);
     if (url == null)
        return null;
     else
        return _parser.parse(url);
  }

  protected URL getPageURL(HttpServletRequest request)
  throws ServletException
  {
    String path = getResourcePath(request);
    try {
      return getServletContext().getResource(path);
    }
    catch (Exception e) {
      throw new ServletException(path,e);
    }
  }

  protected String getResourcePath(HttpServletRequest request)
  {
    String uri  = request.getRequestURI();
    String path = request.getServletPath();
    String pathInfo = request.getPathInfo();
    if (path.equals(uri)) // probably mapped to an extension like .shtml
       return uri;
    else if (pathInfo != null)
       return pathInfo;
    else
       return path;
  }
}
