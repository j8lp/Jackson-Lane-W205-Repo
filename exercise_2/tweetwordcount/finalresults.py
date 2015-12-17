from __future__ import absolute_import, print_function, unicode_literals

from collections import Counter
import psycopg2
import re, sys

conn = psycopg2.connect(database="tcount", user="postgres", password="pass", host="localhost", port="5432")
cur = conn.cursor()
if len(sys.argv)>1:
    rx = re.compile('\W+')
    word = rx.sub('',sys.argv[1]).strip()
    cur.execute("SELECT word, count from Tweetwordcount where word='%s' ORDER BY word" % word)
else:
    cur.execute("SELECT word, count from Tweetwordcount ORDER BY word")
records = cur.fetchall()
for rec in records:
   print("<%s>, %s" % (rec[0],rec[1]))
conn.commit()

conn.close()
