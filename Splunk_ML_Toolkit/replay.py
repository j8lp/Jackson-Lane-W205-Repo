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
        simulate csv=<path> rate=<expected_event_count> interval=<sampling_period> duration=<execution_period>
        [seed=<string>]

    ##Description

    The :code:`simulate` command uses repeated random samples of the event records in :code:`csv` for the execution
    period of :code:`duration`. Sample sizes are determined for each time :code:`interval` in :code:`duration`
    using a Poisson distribution with an average :code:`rate` specifying the expected event count during
    :code:`interval`.

    ##Example

    .. code-block::
        | simulate csv=population.csv rate=50 interval=00:00:01
            duration=00:00:05 | countmatches fieldname=word_count
            pattern="\\w+" text | stats mean(word_count) stdev(word_count)

    This example generates events drawn from repeated random sampling of events from :code:`tweets.csv`. Events are
    drawn at an average rate of 50 per second for a duration of 5 seconds. Events are piped to the example
    :code:`countmatches` command which adds a :code:`word_count` field containing the number of words in the
    :code:`text` field of each event. The mean and standard deviation of the :code:`word_count` are then computed by
    the builtin :code:`stats` command.


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
	if not self.repeats:  self.repeats = 1
	if not self.maxwait: self.maxwait = sys.maxint
        if not self.sourceJob:
        	reversedquery = self.query + "| sort _time"
        	kwargs = {"exec_mode": "blocking"}
        	self.sourceJob = self.service.jobs.create(reversedquery, **kwargs)
	while(self.repeats > 0):
            self.logger.debug('ReplayCommand: %s', self.sourceJob['resultCount'])  # logs command line
	    self.repeats -= 1;
            starttime =  splunk.util.parseISO(splunk.util.getISOTime())
            replaytime =starttime
            self.records = results.ResultsReader(self.sourceJob.results())
            for record in self.records:
                recordDT = splunk.util.parseISO(record['_time'])
                if replaytime < recordDT and (recordDT- replaytime).seconds > 1:
                    self.flush()
                    timetowait = min(self.maxwait,(recordDT- replaytime).seconds -(splunk.util.parseISO(splunk.util.getISOTime())-starttime).seconds)
		    time.sleep(timetowait)
                    starttime = splunk.util.parseISO(splunk.util.getISOTime())
                replaytime = recordDT
                record['_time'] = splunk.util.parseISO(splunk.util.getISOTime()).strftime('%s')

                yield record
	self.finish()
	
            
    def __init__(self):
        super(ReplayCommand, self).__init__()
        self.sourceJob = None

dispatch(ReplayCommand, sys.argv, sys.stdin, sys.stdout, __name__)
