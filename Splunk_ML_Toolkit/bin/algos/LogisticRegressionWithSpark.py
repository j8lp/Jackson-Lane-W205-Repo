#!/usr/bin/env python

import sys,os
sys.path.append(os.environ['SPARK_HOME'] + '/python')
sys.path.append(os.environ['SPARK_HOME'] + '/python/lib/py4j-0.8.2.1-src.zip')
sys.path.append(os.environ['SPARK_HOME'] + '/python/pyspark')
import pyspark
from pyspark.sql import SQLContext 
from pyspark.ml.classification import LogisticRegression as _LogisticRegression

from base import *

class LogisticRegressionWithSpark(EstimatorMixin):
    def __init__(self, *args):
	self.sc = pyspark.SparkContext("local","LGwS")
	self.sqlContext = SQLContext(self.sc)
        try:
            self.response_variable = args[0]
            self.explanatory_variables = args[2:] if args[1] == '~' or args[1].lower() == 'from' else args[1:]
            assert len(self.explanatory_variables) > 0
        except:
            raise Exception('Syntax error: Expected "<target> FROM <field> ...')

        self.estimator = _LogisticRegression()

        self.is_classifier = True

    def fit(self, df):
	df.to_pickle("/tmp/splunkDF")
	sparkDF = self.sqlContext.createDataFrame(df)
	self.estimator.fit(sparkDF )
        

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
