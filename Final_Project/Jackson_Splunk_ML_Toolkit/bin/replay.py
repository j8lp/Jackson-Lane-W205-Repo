#!/usr/bin/env python
# coding=utf-8
#
# Copyright 2011-2015 Splunk, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"): you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

from __future__ import absolute_import, division, print_function, unicode_literals
import app

from splunklib.searchcommands import dispatch, GeneratingCommand, Configuration, Option, validators
from splunklib import client,results
import splunk.util

import random
import csv
import sys
import datetime,time


@Configuration()
class ReplayCommand(GeneratingCommand):
    """ Replays the results of a given search a certain number of times, in real time

    ##Syntax

    .. code-block::
        replay query=<path> [repeats=<times_to_repla> maxwait =<max_time_between_events>]


    """
    query = Option(
        doc='''**Syntax:** **query=***<search-string>*
        **Description:**  The search query that you will replay.  Please be sure to use the search command explicitly''',
        name='query', require=True)

    repeats = Option(
        doc='''**Syntax:** **repeats=***<times-to-repeat>*
        **Description:** How many times to replay the search results''',
        validate=validators.Integer(0))

    maxwait = Option(
        doc='''**Syntax:** **maxwait=***<time-interval>*
        **Description:** The maximum amount of time to wait between two events''',
        validate=validators.Integer(0))

    def generate(self):
        if not self.records:
		self.records = []
        	reversedquery = self.query + "| sort 0 _time"
        	kwargs = {"count": "0"}
		for r in results.ResultsReader(self.service.jobs.oneshot(reversedquery, **kwargs)):
			self.records.append(r)
			yield r
			self.flush()
	while(self.repeats > 0):
	    	self.repeats -= 1
            	starttime =  splunk.util.parseISO(splunk.util.getISOTime())
            	replaytime =starttime
                for record in self.records:
                	recordDT = splunk.util.parseISO(record['_time'])
                	if self.maxwait > 0 and replaytime < recordDT and (recordDT- replaytime).seconds > 1:
                    		self.flush()
                    		timetowait = min(self.maxwait,(recordDT- replaytime).seconds -(splunk.util.parseISO(splunk.util.getISOTime())-starttime).seconds)
		    		time.sleep(timetowait)
                   		starttime = splunk.util.parseISO(splunk.util.getISOTime())
                	replaytime = recordDT
			record['_time'] = splunk.util.parseISO(splunk.util.getISOTime()).strftime('%s')
                	yield record
		self.flush()
	
            
    def __init__(self):
        super(ReplayCommand, self).__init__()
        self.records = None

dispatch(ReplayCommand, sys.argv, sys.stdin, sys.stdout, __name__)
