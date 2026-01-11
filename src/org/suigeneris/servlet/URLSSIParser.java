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
import java.io.*;
import java.net.URL;
import java.net.URLConnection;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Properties;
import java.util.StringTokenizer;

public class URLSSIParser {

  /** The beginning of a SSI command. Defined as '&lt;!--#' */
  protected static final String startTag = "<!--#";

  /** The end of a SSI command. Defined as '--&gt;' */
  protected static final String endTag = "-->";

  public class OpenSsiPage extends SsiPage {
    public void openWritables( SsiBlock block ) {
      super.openWritables(block);
    }

    public void closeWritables() {
      super.closeWritables();
    }
  }

  public URLSSIParser() {
  }

  /**
   * Parse a file.
   *
   * @param file The file to parse
   * @return A memory representation of the associated <code>SsiPage</code>
   * @throws IOException if the file can't be read
   */
  public SsiPage parse( File file ) throws IOException
  {
    return parse(file.toURL());
  }

  /**
   * Parse an InputStream
   *
   * @param file The file to parse
   * @return A memory representation of the associated <code>SsiPage</code>
   * @throws IOException if the file can't be read
   */
  public SsiPage parse(URL url) throws IOException
  {
    // build a new page
    OpenSsiPage page = new OpenSsiPage();

    // get the dictionary for this page
    Context context = page.getContext();

    context.put( "DOCUMENT_FILE", url.toString() );
    context.put( "DOCUMENT_NAME", url.getFile() );

    String path = url.toExternalForm();
    if (path.endsWith("/"))
       context.put( "DOCUMENT_PATH", path);
    else
       context.put( "DOCUMENT_PATH", path.substring(0, path.lastIndexOf('/')+1) );

//		System.out.println( "context=" + context );

    // let's go
    include( page, url);
    return page;
  }

  /**
   * Parse an included file.
   *
   * @param page The page to which the file should be appended
   * @param path The URL of the file to parse.
   * @return A memory representation of the associated <code>SsiPage</code>
   * @throws IOException if the file can't be read
   */
  public SsiPage include( OpenSsiPage page, String path ) throws IOException
  {
    return include(page, new URL(path));
  }

  /**
   * Parse an included file.
   *
   * @param page The page to which the file should be appended
   * @param url The URL of the file to parse.
   * @return A memory representation of the associated <code>SsiPage</code>
   * @throws IOException if the file can't be read
   */
  public SsiPage include( OpenSsiPage page, URL url ) throws IOException
  {
    return include(page, url.openStream());
  }

  /**
   * Parse an included file.
   *
   * @param page The page to which the file should be appended
   * @param input An InputStream containing the SHTML page.
   * @return A memory representation of the associated <code>SsiPage</code>
   * @throws IOException if the file can't be read
   */
  public SsiPage include( OpenSsiPage page, InputStream input ) throws IOException
  {
    return include(page, new InputStreamReader(input));
  }

  /**
   * Parse an included file.
   *
   * @param page The page to which the file should be appended
   * @param input An Reader containing the SHTML page.
   * @return A memory representation of the associated <code>SsiPage</code>
   * @throws IOException if the file can't be read
   */
  public SsiPage include( OpenSsiPage page, Reader input ) throws IOException
  {
//		page.append( "{including " + file + "}" );

    // get a reader for this file
    LineNumberReader reader = new LineNumberReader( input );

    // let's go
    boolean inTag = false;
    StringBuffer text = new StringBuffer();
    StringBuffer tag = new StringBuffer();
    String line = reader.readLine();
    while( line != null )
    {
      line += "\n";

      if( inTag )
      {
        int index = line.indexOf( endTag );
        if( index < 0 )
        {
          tag.append( line );
          tag.append( " " );
          line = reader.readLine();
          continue;
        }
        if( index > 0 )
          tag.append( line.substring( 0, index ) );
        parse( page, tag );
        tag = new StringBuffer();
        inTag = false;
        line = line.substring( index + endTag.length() );
      }

      else
      {
        int index = line.indexOf( startTag );
        if( index < 0 )
        {
          text.append( line );
          text.append( " " );
          line = reader.readLine();
          continue;
        }
        if( index > 0 )
          text.append( line.substring( 0, index ) );
//				System.out.println( "appending text: " + text );
        page.append( text );
        text = new StringBuffer();
        inTag = true;
        line = line.substring( index + startTag.length() );
      }

    }

    if( inTag )
    {
//			System.out.println( "parsing tag: " + tag );
      parse( page, tag );
    }

    else
    {
//			System.out.println( "appending text: " + text );
      page.append( text );
    }

    // return the new page
    return( page );
  }

  /**
   * Parse a SSI comment.
   *
   * @param page The target page
   * @param tag The tag to parse
   */
  protected void parse( OpenSsiPage page, StringBuffer tag )
  {
    parse( page, tag.toString() );
  }

  /**
   * Parse a SSI comment.
   *
   * @param page The target page
   * @param tag The tag to parse
   */
  protected void parse( OpenSsiPage page, String tag )
  {
////	page.append( startTag + tag.toString() + endTag );

    try {
      // trim the tag
      tag = tag.trim();

//			System.out.println( "parsing tag: " + tag );

      // format args
      Properties args = parseArgs( tag );

      // this is the SSI command '#config errmsg="..." timefmt="..." sizefmt="..."'
      if( tag.startsWith( "config" ) )
        parseConfigCommand( page, args );

      // this is the SSI command '#echo var="<name>" header="..." footer="..." line.header="..." line.footer="..."'
      else if( tag.startsWith( "echo" ) )
        parseEchoCommand( page, args );

      // this is the SSI command '#exec java="<name>" arg1="..." arg2="..."'
      else if( tag.startsWith( "exec" ) )
        parseExecCommand( page, args );

      // this is the SSI command '#flastmod file="<name>"'
      else if( tag.startsWith( "flastmod" ) )
        parseFlastmodCommand( page, args );

      // this is the SSI command '#fsize file="<name>"'
      else if( tag.startsWith( "fsize" ) )
        parseFsizeCommand( page, args );

      // this is the SSI command '#include file="<name>"'
      else if( tag.startsWith( "include" ) )
        parseIncludeCommand( page, args );

      // this is the SSI command '#begin"'
      else if( tag.startsWith( "begin" ) )
        parseBeginCommand( page, args );

      // this is the SSI command '#end"'
      else if( tag.startsWith( "end" ) )
        parseEndCommand( page, args );

      // this is the SSI command '#set"'
      else if( tag.startsWith( "set" ) )
        parseSetCommand( page, args );

      // this is not a SSI comment, just write it as standard text
      else
        page.append( startTag + tag.toString() + endTag );

    } catch( Exception exception ) {
//			System.out.println( e.getMessage() );
      exception.printStackTrace();
      page.append( "[" + exception.getClass().getName() + ": " + exception.getMessage() + "]" );
      page.append( getErrorMessage() );
    }
  }

  /**
   * Parse the args of one tag
   *
   * @param text The whole content of one tag
   * @return The static parameters of the element, packaged as a <code>Properties</code>
   */
  protected Properties parseArgs( String line )
  {
    Properties args = new Properties();

    StringTokenizer t = new StringTokenizer( line, "= '\"\t\n\r", true );
//		System.out.println( "parsing tag '" + text + "'" );

    String tag = t.nextToken();
    switch( tag.charAt( 0 ) )
    {
    case '\'':
    case '"':
    case '=':
    case ' ':
    case '\t':
    case '\n':
    case '\r':
      throw new IllegalArgumentException( "invalid token '" + tag + "' in tag" );
//			throw new IllegalArgumentException( lineNumber + ": invalid token '" + tag + "' in tag" );
    default:
    }
//		System.out.println( "<tag=" + tag + ">" );

    int IN_NAME = 0;
    int IN_VALUE = 1;
    int IN_SINGLE_QUOTED_NAME = 2;
    int IN_SINGLE_QUOTED_VALUE = 3;
    int IN_QUOTED_NAME = 4;
    int IN_QUOTED_VALUE = 5;
    int state = IN_NAME;

    String name = "";
    String value = "";
    while( t.hasMoreTokens() )
    {
      String token = t.nextToken();
//			System.out.println( "token=" + token );
      if( state == IN_NAME )
      {
        switch( token.charAt( 0 ) )
        {
        case '\'':
          if( name.length() > 0 )
          {
//						System.out.println( name );
            args.put( name, value );
          }
          name = "";
          state = IN_SINGLE_QUOTED_NAME;
          break;
        case '"':
          if( name.length() > 0 )
          {
//						System.out.println( name );
            args.put( name, value );
          }
          name = "";
          state = IN_QUOTED_NAME;
          break;
        case '=':
          state = IN_VALUE;
          break;
        case ' ':
        case '\t':
        case '\n':
        case '\r':
          break;
        default:
          if( name.length() > 0 )
          {
//						System.out.println( name );
            args.put( name, "" );
          }
          name = token;
        }
      }
      else if( state == IN_VALUE )
      {
        switch( token.charAt( 0 ) )
        {
        case '\'':
          state = IN_SINGLE_QUOTED_VALUE;
          break;
        case '"':
          state = IN_QUOTED_VALUE;
          break;
        case '=':
//					throw new IllegalArgumentException( lineNumber + ": unexpected '" + token + "'" );
        case ' ':
        case '\t':
        case '\n':
        case '\r':
          break;
        default:
//					System.out.println( name + "=" + token );
          args.put( name, token );
          name = "";
          value = "";
          state = IN_NAME;
        }
      }
      else if( state == IN_SINGLE_QUOTED_NAME )
      {
        if( token.charAt( 0 )  == '\'' )
          state = IN_VALUE;
        else
          name += token;
      }
      else if( state == IN_QUOTED_NAME )
      {
        if( token.charAt( 0 )  == '"' )
          state = IN_VALUE;
        else
          name += token;
      }
      else if( state == IN_SINGLE_QUOTED_VALUE )
      {
        if( token.charAt( 0 )  == '\'' )
        {
//					System.out.println( name + "=" + value );
          args.put( name, value );
          name = "";
          value = "";
          state = IN_NAME;
        }
        else
          value += token;
      }
      else if( state == IN_QUOTED_VALUE )
      {
        if( token.charAt( 0 )  == '"' )
        {
//					System.out.println( name + "=" + value );
          args.put( name, value );
          name = "";
          value = "";
          state = IN_NAME;
        }
        else
          value += token;
      }

    }
    if( name.length() > 0 )
    {
      if( value.length() > 0 )
      {
//				System.out.println( name + "=" + value );
        args.put( name, value );
      }
      else
      {
//				System.out.println( name );
        args.put( name, "" );
      }
    }

    return( args );
  }

  /**
   * Parse the args of the SSI directive '#config'.
   *
   * @param page The target page
   * @param args The arguments of the command
   */
  protected void parseConfigCommand( OpenSsiPage page, Properties args )
  {
    for( Enumeration enum = args.propertyNames(); enum.hasMoreElements(); )
    {
      String name = (String)enum.nextElement();
      String value = args.getProperty( name );
      if( value.length() == 0 )
        continue;

      if( name.equals( "errmsg" ) )
      {
        setErrorMessage( value );
        continue;
      }

      if( name.equals( "timefmt" ) )
      {
        setTimeFormat( value );
        continue;
      }

      if( name.equals( "sizefmt" ) )
      {
        setSizeFormat( value );
        continue;
      }

      throw new IllegalArgumentException( "unexpected attribute name '" + name + "'");
    }
  }

  /**
   * Parse the args of the SSI directive '#echo'.
   *
   * @param page The target page
   * @param args The arguments of the command
   */
  protected void parseEchoCommand( OpenSsiPage page, Properties args )
  {
    // the first attribute is the name of the attribute to display
    String value = args.getProperty( "var", "" );
    if( value == null || value.length() < 1 )
      throw new IllegalArgumentException( "can't find the attribute 'var'");

    // create a new Writable
    PropertyElement element;

    // DATE_GMT contains the current date & time
    if( value.equals( "DATE_GMT" ) )
      element = new DateElement();

    // DATE_LOCAL contains the current date & time
    else if( value.equals( "DATE_LOCAL" ) )
      element = new DateElement();

    // LAST_MODIFIED contains the date of document last modification
    else if( value.equals( "LAST_MODIFIED" ) )
    {
      element = new DateElement();

      value = (String)page.getContext().get( "DOCUMENT_FILE" );
      if( value == null || value.length() < 1 )
        value = (String)page.getContext().get( "DOCUMENT_NAME" );
      if( value == null || value.length() < 1 )
      {
        page.append( getErrorMessage() );
        return;
      }

      try {
          URL handle = new URL( value );
          URLConnection conn = handle.openConnection();
          Date lastModified = new Date( conn.getLastModified() );
          page.getContext().put( value + ".LAST_MODIFIED", lastModified );
      }
      catch (IOException e) {
        page.append( "[" + e.getClass().getName() + ": " + e.getMessage() + "]" );
        page.append( getErrorMessage() );
      }

      args.put( "var", value + ".LAST_MODIFIED" );
    }

    else
      element = new PropertyElement();

    // complete args for this element
    args.put( "errormsg", getErrorMessage() );
    args.put( "timefmt", getTimeFormat() );
    args.put( "sizefmt", getSizeFormat() );

    // set args of this element
    element.setParameters( args );

    // put it in the page
    page.append( element );
  }

  /**
   * Parse the args of the SSI directive '#exec'.
   *
   * @param page The target page
   * @param args The arguments of the command
   * @throw Exception If an exception is encountered
   */
  protected void parseExecCommand( OpenSsiPage page, Properties args ) throws Exception
  {
    // create a new element
    Writable element;

    String cmd = args.getProperty( "cmd" );
    String java = args.getProperty( "java" );

    // using absolute name
    if( cmd != null && cmd.length() >= 1  )
      element = new CommandElement();

    // using relative name
    else if( java != null && java.length() >= 1 )
      element = (Writable)Class.forName( java ).newInstance();

    else
      throw new IllegalArgumentException( "should fetch a 'cmd' or 'java' attribute" );

    // complete args for this element
    args.put( "errormsg", getErrorMessage() );
    args.put( "timefmt", getTimeFormat() );
    args.put( "sizefmt", getSizeFormat() );

    // set args of this element
    element.setParameters( args );

    // put it in the page
    page.append( element );
  }

  /**
   * Parse the args of the SSI directive '#flastmod'.
   *
   * @param page The target page
   * @param args The arguments of the command
   */
  protected void parseFlastmodCommand( OpenSsiPage page, Properties args )
  {
    String absolute = args.getProperty( "file", "" );
    String virtual = args.getProperty( "virtual", "" );

    URL handle = null;
    // using absolute name
    try {
      if( absolute.length() >= 1  )
        handle = new URL("file:", null, absolute);
      // using relative name
      else if( virtual.length() >= 1 )
        handle = getURL(page, virtual);
      else
        throw new IllegalArgumentException( "should fetch a 'file' or 'virtual' attribute" );

      URLConnection conn = handle.openConnection();
      Date lastModified = new Date( conn.getLastModified() );
      SimpleDateFormat formatter = new SimpleDateFormat();
      page.getContext().put( handle.toString() + ".LAST_MODIFIED", formatter.format( lastModified ) );
    }
    catch(IOException e) {
      page.append( getErrorMessage() );
    }

    DateElement element = new DateElement();

    args.put( "var", handle.toString() + ".LAST_MODIFIED" );
    args.put( "timefmt", getTimeFormat() );
    element.setParameters( args );

    page.append( element );
  }

  /**
   * Parse the args of the SSI directive '#fsize'.
   *
   * @param page The target page
   * @param args The arguments of the command
   */
  protected void parseFsizeCommand( OpenSsiPage page, Properties args )
  {
    String value = "";

    String absolute = args.getProperty( "file", "" );
    String virtual = args.getProperty( "virtual", "" );

    // using absolute name
    if( absolute.length() >= 1  )
      value = absolute;

    // using relative name
    else if( virtual.length() >= 1 )
      value = page.getContext().getProperty( "DOCUMENT_PATH" ) + File.separatorChar + virtual;

    else
      throw new IllegalArgumentException( "should fetch a 'file' or 'virtual' attribute" );

    File handle = new File( value );
    if( handle.exists() )
      page.append( formatSize( handle.length() ) );
    else
      page.append( getErrorMessage() );

  }

  public URL getURL(OpenSsiPage page, String virtual)
  throws java.net.MalformedURLException
  {
      URL docpath = new URL(page.getContext().getProperty( "DOCUMENT_PATH" ));
      if( virtual.startsWith( "/" ) )
        return new URL(docpath.getProtocol(), null, virtual);
      else
        return new URL(docpath, virtual);
  }

  /**
   * Parse the args of the SSI directive '#include'.
   * If the parameter <code>virtual</code> is defined, this function will parse the indicated file recursively.
   * If the parameter <code>file</code> is defined, this function will put a <code>CgiElement</code> in the page
   * to process it later. The file page is NOT parsed recursively.
   *
   * @param page The target page
   * @param args The arguments of the command
   */
  protected void parseIncludeCommand( OpenSsiPage page, Properties args )
  throws IOException
  {
    String file = args.getProperty( "file", "" );
    String virtual = args.getProperty( "virtual", "" );

    // using file name
    if( virtual.length() >= 1  )
    {
      include( page, getURL(page, virtual) );
    }
    else if( file.length() >= 1 )
    {
//				System.out.println( "including an URL" );
      CgiElement element = new CgiElement();

      URL url = getURL(page, file);
      // complete args for this element
      args.put( "url", url.toString() );
      args.put( "errormsg", getErrorMessage() );
      args.put( "timefmt", getTimeFormat() );
      args.put( "sizefmt", getSizeFormat() );

      // set args of this element
      element.setParameters( args );

      // put it in the page
      page.append( element );
    }

    else
      throw new IllegalArgumentException( "should fetch a 'file' or 'virtual' attribute" );

  }


  /**
   * Beginning a new block with '#begin'.
   *
   * @param page The target page
   * @param args The arguments of the command
   */
  protected void parseBeginCommand( OpenSsiPage page, Properties args )
  {
    SsiBlock block = new SsiBlock();
    block.setParameters( args );

    page.openWritables( block );
  }

  /**
   * Closing a block with '#end'.
   *
   * @param page The target page
   * @param args The arguments of the command
   */
  protected void parseEndCommand( OpenSsiPage page, Properties args )
  {
    page.closeWritables();
  }

  /**
   * Set a value with '#set'.
   *
   * @param page The target page
   * @param args The arguments of the command
   */
  protected void parseSetCommand( OpenSsiPage page, Properties args )
  {
    // create a new element
    Writable element = new SetElement();

    // complete args for this element
    args.put( "errormsg", getErrorMessage() );
    args.put( "timefmt", getTimeFormat() );
    args.put( "sizefmt", getSizeFormat() );

    // set args of this element
    element.setParameters( args );

    // put it in the page
    page.append( element );
  }

  //
  // About error messages
  //

  /** The message displayed if an error is encountered */
  protected String errorMessage = "[Error while processing this directive]";

  /**
   * Get the error message.
   * @return The current error message
   */
  public String getErrorMessage()
  {
    return( errorMessage );
  }

  /**
   * Modify the error message.
   * @param message The new error message
   */
  public void setErrorMessage( String message )
  {
    errorMessage = message;
  }

  //
  // About size format
  //

  /** The current formatting string for sizes */
  protected String sizeFormat = "bytes";

  /**
   * Get the size formatting string.
   * @return The current formatting string
   */
  public String getSizeFormat()
  {
    return( sizeFormat );
  }

  /**
   * Set the size formatting string.
   * @param format The new formatting string
   */
  public void setSizeFormat( String format )
  {
    sizeFormat = format;
  }

  /**
   * Format a size according to the current sizeformat directive
   *
   * @param size The size to format
   * @return A printable string
   */
  public String formatSize( long size )
  {
    String line = Long.toString( size );

    if( getSizeFormat().equals( "abbrev" ) )
    {
      int count = line.length();
      if( count > 9 )
        line = line.substring( 0, count - 9 ) + "G";
      else if( count > 6 )
        line = line.substring( 0, count - 6 ) + "M";
      else if( count > 3 )
        line = line.substring( 0, count - 3 ) + "K";
    }

    return( line );
  }


  //
  // About time format
  //

  /** The current time formatting string */
  protected String timeFormat = "%a %b %d %H:%M:%S %Y";

  /**
   * Get the current time formatting string.
   * @return The current time formatting string
   */
  public String getTimeFormat()
  {
    return( timeFormat );
  }

  /**
   * Set the current time formatting string.
   * @param format The new formatting string
   */
  public void setTimeFormat( String format )
  {
    timeFormat = format;
  }
}
