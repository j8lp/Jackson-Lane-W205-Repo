from __future__ import absolute_import, print_function, unicode_literals

from collections import Counter
import psycopg2
import re, sys

conn = psycopg2.connect(database="tcount", user="postgres", password="pass", host="localhost", port="5432")
cur = conn.cursor()
args = sys.argv[1].split(",")
cur.execute("SELECT word, count from Tweetwordcount where count >= %s and count <= %s" % (args[0],args[1]))
records = cur.fetchall()
for rec in records:
   print("<%s>: %s"% (rec[0],rec[1]))
conn.commit()
conn.close()
