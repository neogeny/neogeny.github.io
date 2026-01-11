package org.suigeneris.servlet;

import java.io.IOException;
import java.io.FileNotFoundException;
import java.io.FileInputStream;

import java.util.Properties;
import java.util.Vector;

import javax.servlet.*;
import javax.servlet.http.*;

import org.apache.velocity.Template;
import org.apache.velocity.context.Context;
import org.apache.velocity.app.Velocity;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.apache.velocity.exception.ParseErrorException;

public class VelocityServlet extends org.apache.velocity.servlet.VelocityServlet
{

    protected Template handleRequest( HttpServletRequest request, HttpServletResponse response, Context ctx ) 
    throws  ParseErrorException, ResourceNotFoundException
    {        
      String uri  = request.getRequestURI();
      String path = request.getServletPath();
      String pathInfo = request.getPathInfo();

      String resource = (pathInfo != null ? pathInfo : path);
      if (resource.startsWith("/"))
        resource = resource.substring(1);

      System.err.println();
      System.err.println("*********      uri:"+ uri);
      System.err.println("*********     path:"+ path);
      System.err.println("********* pathInfo:"+ pathInfo);
      System.err.println("********* resource:"+ resource);


      Template result = null;
      
      try {
        result = getTemplate(resource);
      }
      catch( ParseErrorException pee )
      {
          throw pee;
      }
      catch( ResourceNotFoundException rnfe )
      {
          throw rnfe;
      }
      catch( Exception e )
      {
          System.out.println("Error " + e);
      }
      return result;
    }

    public Template getTemplate( String name )
    throws ParseErrorException, ResourceNotFoundException, Exception
    {
      //return super.getTemplate(getServletContext().getRealPath(name));
      System.err.println();
      System.err.println("********* template:"+ name);
      return super.getTemplate(name);
    }


    protected Properties loadConfiguration(ServletConfig config )
        throws IOException, FileNotFoundException
    {
        Properties p = new Properties();

        String propsFile = config.getInitParameter(INIT_PROPS_KEY);
        if ( propsFile != null )
        {
            String realPath = getServletContext().getRealPath(propsFile);
            if ( realPath != null )
                propsFile = realPath;
            p.load( new FileInputStream(propsFile) );
        }


        String log = p.getProperty( Velocity.RUNTIME_LOG);
        if (log != null )
        {
            log = getServletContext().getRealPath( log );
            if (log != null)
                p.setProperty( Velocity.RUNTIME_LOG, log );
        }

       
        String path = p.getProperty( Velocity.FILE_RESOURCE_LOADER_PATH );
        if ( path != null)
        {
            path = getServletContext().getRealPath(  path );
            if ( path != null)
                p.setProperty( Velocity.FILE_RESOURCE_LOADER_PATH, path );
        }

        System.err.println();
        System.err.println("********* propsFile:"+ propsFile);
        System.err.println("********* file.path:"+ path);
        System.err.println("*********  log.file:"+ log);
 
        return p;
    }  
}
