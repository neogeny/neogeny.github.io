#$Id: list2html.py,v 1.1 2009-04-14 19:41:57 juanca Exp $
import time
import sys
import os.path

def fixURL(url):
  url = url.replace(' ', '_')
  url = url.replace("'", '_')
  url = url.replace('ñ', 'n~')
  url = url.replace('á', 'a')
  url = url.replace('é', 'e')
  url = url.replace('í', 'i')
  url = url.replace('ó', 'o')
  url = url.replace('ú', 'u')
  return url

def makeRowFileName(row):
  url =row['nombre'].lower()
  url = url + ' ' + row['apellido'].lower()
  url = fixURL(url)
  return url

def compareKeyValues(key):
  def compareValues(r,s, k=key):
    vr = r[k]
    vs = s[k]
    if vr == vs:
      return 0
    elif vr < vs:
      return -1
    else:
      return 1
  return compareValues


def parseCSV(fname):
  global root
  raw = open(fname).readlines()
  names = raw[0].strip().split(",")
  rows = []
  for i in range(1,len(raw)):
    fields = raw[i].strip().split(",")
    row = {}
    for j in range(0, len(names)):
      if j < len(fields):
        row[names[j]] = fields[j].strip()
      else:
        row[names[j]] = ''
    row['file_name']  = makeRowFileName(row) 
    row['local_url']  = 'bio/' + row['file_name']+ '.html'
    row['bio_file']   = root + 'bio/'+ row['file_name']+ '.bio.html'
    row['photo_file'] = root + 'bio/images/'+ row['file_name']+ '.jpg'
    row['photo_url']  = 'images/'+ row['file_name']+ '.jpg'
    rows.append(row)
  return (names,rows)

def formatField(k, value):
  value = value.strip()
  if value == '' :
    value = ' '
  elif k == 'e-milio' :
    value = '<a href="mailto:' + value + '">' + value + '</a>'
  elif k == 'alias' :
    if value <> '':
      value = '(' + value + ')'
  elif k == 'url' :
    value = '<a href="' + value + '">' + value + '</a>'
  return value

def toHTMLList(names, list, e_milio):  
  result =  ['']
  for i in range(0,len(list)):
    row = list[i]
    biofname = row['bio_file']
    if (row['e-milio'] <> '') <> e_milio:
      continue
    value = ''
    for k in ['nombre','apellido']:
      if row[k] <> '':
        value = value + ' ' + formatField(k, row[k])
    if value.strip() == '':
      value =formatField('alias', row['alias']) 
    if e_milio:
      value = '<a class="navbar" href="' + row['local_url'] + '">' + value + '</a>'
    result.append(value + '<br>');
  return "\n".join(result)

def toHTML(names, list):  
  result =  ['  <tr align="left" bgcolor="black" >']
  for k in names:
    result.append('    <th color="white">' + k + '</th>')
  result.append('  </tr>')
  for i in range(0,len(list)):
    row = list[i]
    result.append('  <tr>')
    for k in names:
      value = formatField(k, row[k])
      if k == 'nombre' or k == 'apellido' or k == 'alias':
        if row['e-milio'] <> '':
          value = '<a href="' + row['local_url'] + '">' + value + '</a>'
      result.append('    <td nowrap>' + value + '</td>')
    result.append('  </tr>')
  return "\n".join(result)

def makeBio(row):
  fname = row['local_url']
  text = open(root + 'src/bio_template.html').read()
  for k in row.keys():
    text = text.replace('[[' + k + ']]', formatField(k, row[k])) 

  bio = ''
  biofname = row['bio_file']
  #if os.path.exists(biofname):
  #  bio = open(biofname).read()

  photofname = row['photo_file']
  imghtml = ''
  if (row['foto'] <> '') or os.path.exists(photofname):
    purl = row['foto']
    if purl == '':
      purl = row['photo_url']
    imghtml = '<a href="'+ purl + '">'
    imghtml = imghtml + '<img src="' + purl + '"'
    imghtml = imghtml + ' alt="' + row['nombre'] + ' ' + row['apellido'] + '"'
    imghtml = imghtml + ' width="256"'
    imghtml = imghtml + ' hspace="8"'
    imghtml = imghtml + ' vspace="4"'
    imghtml = imghtml + '></a>'

  text = text.replace('[[img]]', imghtml)
  text = text.replace('[[bio]]', bio);
  open(root + fname, 'w+').write(text)
  
# main


global root
script = 'list2html.py'
if os.path.exists('./' + script) or os.path.exists('../src/' + script):
  root='../'
else:
  root='./'

(names,list) = parseCSV(root + 'lib/lista.csv')
list.sort(compareKeyValues('apellido'))
list.sort(compareKeyValues('nombre'))

text = toHTML(names, list)
template = open(root + 'src/template.html').read()
result = template.replace('[[table]]', text)
open(root + 'lista.html','w+').write(result)

open(root + 'contactos.html','w+').write(toHTMLList(names,list,1))
open(root + 'faltan.html','w+').write(toHTMLList(names,list,0))
map(makeBio, list)

print 'done!'

