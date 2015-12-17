#!/usr/bin/env python

import sys
from splunklib.searchcommands import \
    dispatch, GeneratingCommand, Configuration, Option, validators

@Configuration()
class GenerateCommand(GeneratingCommand):
    """ %(synopsis)

    ##Syntax

    %(syntax)

    ##Description

    %(description)

    """
    def generate(self):
       # Put your event  code here
       pass

dispatch(%(command.title())Command, sys.argv, sys.stdin, sys.stdout, __name__)
