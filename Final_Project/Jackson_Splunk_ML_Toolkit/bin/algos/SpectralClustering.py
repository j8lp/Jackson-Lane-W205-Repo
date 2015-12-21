#!/usr/bin/env python

import sys
from sklearn.cluster import SpectralClustering as _SpectralClustering
import pandas as pd
import numpy as np

from base import *

class SpectralClustering(BaseMixin):
    def __init__(self, *args, **params):
        try:
            self.variables = args[:]
            assert len(self.variables) > 0
        except:
            raise Exception('Syntax error: Expected "<field> ...')

        out_params = self.convert_params(
            params,
            floats=['gamma'],
            strs=['affinity'],
            ints=['k'],
            aliases = {
                'k': 'n_clusters'
            }
        )

        self.estimator = _SpectralClustering(**out_params)

    def fit_predict(self, df):
        # Drop columns the user didn't ask for.
        dropcols = set(df.columns).difference(list(self.variables))
        df.drop(dropcols, inplace=True, axis=1)

        # Warn if some explanatory variables aren't present.
        missing_columns = set(self.variables).difference(df.columns)
        if len(missing_columns) > 0:
            print >>sys.stderr, str(self.__class__) + ':', 'Some fields are missing: ' + ', '.join(missing_columns)

        # Get dummies.
        self.filter_non_numeric(df)
        df = pd.get_dummies(df, prefix_sep='=', sparse=True)

        # Find and drop NANs.
        nans = df.isnull().any(axis=1).values
        length = len(df)
        df.dropna(inplace=True)

        # Predict.
        y_hat = self.estimator.fit_predict(df.values)

        # Return a vector of predictions with nans for any rows we
        # skipped.
        output_name = 'cluster'
        output = pd.DataFrame({ output_name: np.empty(length) })
        output[output_name] = np.nan
        output.ix[~nans, output_name] = y_hat

        return output
