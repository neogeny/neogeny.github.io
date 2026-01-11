function aref(name, domain, type, content)
{
    theRef = name + "\&#64;" + domain + "\&#46;" + type;
    if (content == null)
        content=theRef;
    anchor = "<a href=mailto:" + theRef + ">" + content + "</a>";
    document.write(anchor);
}

