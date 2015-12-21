#!/usr/bin/env python

import sys
from sklearn.linear_model import LinearRegression as _LinearRegression
import pandas as pd
import numpy as np

from base import *

class LinearRegression(EstimatorMixin):
    def __init__(self, *args):
        try:
            self.response_variable = args[0]
            self.explanatory_variables = args[2:] if args[1] == '~' or args[1].lower() == 'from' else args[1:]
            assert len(self.explanatory_variables) > 0
        except:
            raise Exception('Syntax error: Expected "<target> FROM <field> ..."')

        self.estimator = _LinearRegression()

    def summary(self):
        df = pd.DataFrame({'feature': self.columns,
                           'coefficient': self.estimator.coef_.ravel()})
        idf = pd.DataFrame({'feature': ['intercept'],
                            'coefficient': [self.estimator.intercept_]})
        return pd.concat([df, idf])
