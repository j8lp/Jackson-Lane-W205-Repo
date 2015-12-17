#!/usr/bin/env python

import sys
from sklearn.decomposition import PCA as _PCA
import pandas as pd
import numpy as np

from base import *

class PCA(EstimatorMixin):
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
                'k': 'n_components'
            }
        )

        self.estimator = _PCA(**out_params)

    def fit(self, df):
        # Drop columns the user didn't ask for.
        dropcols = set(df.columns).difference(list(self.variables))
        df.drop(dropcols, inplace=True, axis=1)

        # Warn if some explanatory variables aren't present.
        missing_columns = set(self.variables).difference(df.columns)
        if len(missing_columns) > 0:
            print >>sys.stderr, 'Some fields are missing: ' + ', '.join(missing_columns)

        # Get dummies.
        self.filter_non_numeric(df)
        df = pd.get_dummies(df, prefix_sep='=', sparse=True)

        # Drop rows with NAs.
        df.dropna(inplace=True)

        # Sort columns and save.
        df.sort_index(inplace=True, axis=1)
        self.columns = list(df.columns)

        # Fit the model.
        self.estimator.fit(df.values)

    def predict(self, df):
        # Get dummies.
        self.filter_non_numeric(df)
        df = pd.get_dummies(df, prefix_sep='=', sparse=True)

        # Only keep columns in the model.
        keepcols = list(set(df.columns).intersection(set(self.columns)))
        df = df[keepcols]

        # Error if no explanatory variables present.
        if len(keepcols) == 0:
            raise Exception('No explanatory variables are present')

        # Fill missing columns with 0's. Note: if a column is present
        # and has nans, those nans will remain. This 0 filling is only
        # for columns entirely absent from the new table.
        missing_columns = set(self.columns).difference(set(df.columns))
        for col in missing_columns:
            df[col] = 0

        # Sort columns.
        df.sort_index(inplace=True, axis=1)

        # Validate columns in design matrix.
        if list(df.columns) != self.columns:
            raise Exception('Internal error: column mismatch')

        # Find and drop NANs.
        nans = df.isnull().any(axis=1).values
        length = len(df)
        df.dropna(inplace=True)

        # Predict.
        y_hat = self.estimator.transform(df.values)

        # Return a vector of predictions with nans for any rows we
        # skipped.
        width = y_hat.shape[1]
        columns = ['pca%d' % (i+1) for i in range(width)]

        output = pd.DataFrame(np.zeros((length,width)), columns = columns)
        output.ix[:,columns] = np.nan
        output.ix[~nans, columns] = y_hat

        return output
