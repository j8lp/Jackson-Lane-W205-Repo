from __future__ import absolute_import, print_function, unicode_literals

from collections import Counter
from streamparse.bolt import Bolt
import psycopg2
import re


class WordCounter(Bolt):
    def initialize(self, conf, ctx):
        self.counts = Counter()
        ##for some reason, Postgres created my database as 'tcount' instead of 'Tcount'.
        # I think that my postgres can't accept capital letters.  Hope that's okay.
        conn = psycopg2.connect(database="tcount", user="postgres", password="pass", host="localhost", port="5432")
        cur = conn.cursor()
        try:
            cur.execute('''CREATE TABLE Tweetwordcount
        		(word TEXT PRIMARY KEY     NOT NULL,
            		count INT     NOT NULL);''')
        except Exception as e:
            pass
        conn.commit()
        conn.close()

    def process(self, tup):
        rx = re.compile('\W+')
        word = rx.sub('', tup.values[0]).strip()

        # Write codes to increment the word count in Postgres
        # Use psycopg to interact with Postgres
        # Database name: Tcount 
        # Table name: Tweetwordcount 
        # you need to create both the database and the table in advance.
        conn = psycopg2.connect(database="tcount", user="postgres", password="pass", host="localhost", port="5432")
        cur = conn.cursor()

        try:
            cur.execute("INSERT INTO Tweetwordcount (word,count) VALUES ('%s', 1)" % word)
            conn.commit()
        except Exception as e:
            conn.close()
            conn = psycopg2.connect(database="tcount", user="postgres", password="pass", host="localhost", port="5432")
            cur = conn.cursor()
            cur.execute("UPDATE Tweetwordcount SET count=count+1 WHERE word='%s'" % word)
            conn.commit()
        # Increment the local count
        self.counts[word] += 1
        self.emit([word, self.counts[word]])
        conn.close()

        # Log the count - just to see the topology running
        self.log('%s: %d' % (word, self.counts[word]))
