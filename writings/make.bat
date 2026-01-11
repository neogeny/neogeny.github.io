@echo off

do file in raw\*.raw

   set base=%@name[%file]
   echo %file, %base

   python format.py %file >! %base.html
enddo
