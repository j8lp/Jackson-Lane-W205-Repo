#!/usr/bin/env python

import sys
from sklearn.linear_model import LogisticRegression as _LogisticRegression
import pandas as pd
import numpy as np

from base import *

class LogisticRegression(EstimatorMixin):
    def __init__(self, *args):
        try:
            self.response_variable = args[0]
            self.explanatory_variables = args[2:] if args[1] == '~' or args[1].lower() == 'from' else args[1:]
            assert len(self.explanatory_variables) > 0
        except:
            raise Exception('Syntax error: Expected "<target> FROM <field> ...')

        self.estimator = _LogisticRegression(class_weight='auto')
        self.is_classifier = True

    def summary(self):
        df = pd.DataFrame()

        n_classes = len(self.estimator.classes_)
        limit = 1 if n_classes == 2 else n_classes

        for i,c in enumerate(self.estimator.classes_[:limit]):
            cdf = pd.DataFrame({'feature': self.columns,
                                'coefficient': self.estimator.coef_[i].ravel()})
            cdf = cdf.append(pd.DataFrame({'feature': ['intercept'],
                                           'coefficient': [self.estimator.intercept_[i]]}))
            cdf['class'] = c
            df = df.append(cdf)

        return df
