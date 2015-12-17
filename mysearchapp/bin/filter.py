#!/usr/bin/env python

import sys
from splunklib.searchcommands import \
    dispatch, StreamingCommand, Configuration, Option, validators


@Configuration()
class FilterCommand(EventingCommand):
    """ %(synopsis)

    ##Syntax

    %(syntax)

    ##Description

    %(description)

    """
    def transform(self, events):
       # Put your event transformation code here
       pass

dispatch(%(command.title())Command, sys.argv, sys.stdin, sys.stdout, __name__)
