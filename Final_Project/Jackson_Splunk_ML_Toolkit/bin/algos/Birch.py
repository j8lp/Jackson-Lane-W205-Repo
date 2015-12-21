#!/usr/bin/env python

import sys
from sklearn.cluster import Birch as _Birch
import pandas as pd
import numpy as np

from base import *

class Birch(ClustererMixin):
    def __init__(self, *args, **params):
        try:
            self.variables = args[:]
            assert len(self.variables) > 0
        except:
            raise Exception('Syntax error: Expected "<field> ..."')

        out_params = self.convert_params(
            params,
            ints=['k'],
            aliases = {
                'k': 'n_clusters'
            }
        )

        self.estimator = _Birch(**out_params)
