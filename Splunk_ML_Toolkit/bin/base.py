#!/usr/bin/env python

import sys
import pandas as pd
import numpy as np

class BaseMixin(object):
    def convert_params(self, params, floats=[], ints=[], strs=[], aliases={}):
        out_params = {}
        for p in params:
            op = aliases.get(p, p)
            if p in floats:
                try: out_params[op] = float(params[p])
                except:
                    raise Exception("Invalid value for %s: must be a float" % p)
            elif p in ints:
                try: out_params[op] = int(params[p])
                except:
                    raise Exception("Invalid value for %s: must be an int" % p)
            elif p in strs:
                out_params[op] = params[p]
            else:
                raise Exception("Unexpected parameter: %s" % p)

        return out_params

    def filter_non_numeric(self, df):
        # Filter out non-numeric columns with too many factors.
        dropcols = []
        scols = list(df.dtypes[df.dtypes == 'object'].index)
        for scol in scols:
            if df[scol].nunique() > 100:
                print >>sys.stderr, 'Column "%s" takes too many unique values, dropping.' % scol
                dropcols.append(scol)
        df.drop(dropcols, inplace=True, axis=1)

class EstimatorMixin(BaseMixin):
    def fit(self, df):
        # Make sure response_variable is present.
        if self.response_variable not in df:
            raise Exception('Response variable "%s" not present' % self.response_variable)

        # Limit the number of categories for classifiers.
        if 'is_classifier' in dir(self):
            n = df[self.response_variable].nunique()
            if n > 100:
                raise Exception('Response variable "%s" takes too many values: %d (max 100)' % (
                    self.response_variable, n))

        # Drop columns the user didn't ask for.
        dropcols = set(df.columns).difference([self.response_variable] + list(self.explanatory_variables))
        df.drop(dropcols, inplace=True, axis=1)

        # Warn if some explanatory variables aren't present.
        missing_columns = set(self.explanatory_variables).difference(df.columns)
        if len(missing_columns) > 0:
            print >>sys.stderr, 'Some fields are missing: ' + ', '.join(missing_columns)

        # Split response and design matrix.
        y = df[self.response_variable]
        df.drop(self.response_variable, inplace=True, axis=1)

        # Get dummies.
        self.filter_non_numeric(df)
        df = pd.get_dummies(df, prefix_sep='=', sparse=True)

        # Drop columns with all NAs
        df.dropna(axis=1, how='all', inplace=True)

        # Drop rows with NAs.
        na = pd.concat([df.isnull(),y.isnull()],axis=1).any(axis=1)
        y = y[~na]
        df = df[~na]

        if len(df.columns) == 0:
            raise Exception('No valid columns')

        if len(df) == 0:
            raise Exception('No valid events; check null or non-numeric values in numeric fields')

        # Sort columns and save.
        df.sort_index(inplace=True, axis=1)
        self.columns = list(df.columns)

        # Fit the model.
        self.estimator.fit(df.values, y.values)

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

        # Fill missing columns with 0's.
        missing_columns = set(self.columns).difference(set(df.columns))
        for col in missing_columns:
            df[col] = 0

        # Sort columns and save.
        df.sort_index(inplace=True, axis=1)

        # Validate columns in design matrix.
        if list(df.columns) != self.columns:
            raise Exception('Internal error: column mismatch')

        # Find and drop NANs.
        nans = df.isnull().any(axis=1).values
        length = len(df)
        df.dropna(inplace=True)

        # Predict.
        y_hat = self.estimator.predict(df.values)

        # Return a vector of predictions with nans for any rows we
        # skipped.
        output_name = 'predicted(%s)' % self.response_variable
        output = pd.DataFrame({ output_name: np.empty(length) })
        output[output_name] = np.nan
        output.ix[~nans, output_name] = y_hat

        return output

class ClustererMixin(BaseMixin):
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
        y_hat = self.estimator.predict(df.values)

        # Return a vector of predictions with nans for any rows we
        # skipped.
        output_name = 'cluster'
        output = pd.DataFrame({ output_name: np.empty(length) })
        output[output_name] = np.nan
        output.ix[~nans, output_name] = y_hat

        return output
