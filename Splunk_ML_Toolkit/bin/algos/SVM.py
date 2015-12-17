#!/usr/bin/env python

import sys
from sklearn.svm import SVC
import pandas as pd
import numpy as np

from base import *

class SVM(EstimatorMixin):
    def __init__(self, *args, **params):
        try:
            self.response_variable = args[0]
            self.explanatory_variables = args[2:] if args[1] == '~' or args[1].lower() == 'from' else args[1:]
            assert len(self.explanatory_variables) > 0
        except:
            raise Exception('Syntax error: Expected "<target> FROM <field> ...')

        out_params = self.convert_params(params, floats=['gamma'])

        self.estimator = SVC(class_weight='auto', **out_params)
        self.is_classifier = True
