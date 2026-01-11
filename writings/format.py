#<pre>
#$Id: format.py,v 1.1 2009-04-14 19:41:38 juanca Exp $
import string
import time
import sys

if len(sys.argv) < 2 :
 print "Ussage: " + sys.argv[0] + " <raw-file>"
 sys.exit()

filename = sys.argv[1] 

months = ["January","February","March","April","May","June", 
          "July","August", "September", "October", "November", "December" ]

template = open("template.html").read()
raw = open(filename).readlines()
title  = string.strip(raw[0])
author = string.strip(raw[1])
sdate  = string.strip(raw[2])  # short format
link   = string.strip(raw[3])
short  = []
text   = []
for i in range(4,len(raw)):
  if string.strip(raw[i]) == "":
    text   = raw[i+1:]
    break
  else:
    short.append(raw[i])

short  = string.join(short)
text   = string.join(text)

date  = tuple(map(string.atoi, string.split(sdate, "/"))) + (0,0,0)*2

long_date = time.strftime(months[date[1]-1] + " %d, %Y", date)


result = string.replace(template, "<macro:title>",     title)
result = string.replace(result,   "<macro:author>",    author)
result = string.replace(result,   "<macro:date>",      sdate)
result = string.replace(result,   "<macro:long_date>", long_date)
result = string.replace(result,   "<macro:link>",      link)
result = string.replace(result,   "<macro:short>",     short)

text = string.replace(text, "\$\Id\$", "$")
result = string.replace(result,   "<macro:text>",     text)

print result

