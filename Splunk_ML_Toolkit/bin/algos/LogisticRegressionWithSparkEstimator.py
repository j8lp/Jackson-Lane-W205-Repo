#!/usr/bin/env python

import sys, os

sys.path.append(os.environ['SPARK_HOME'] + '/python')
sys.path.append(os.environ['SPARK_HOME'] + '/python/lib/py4j-0.8.2.1-src.zip')
sys.path.append(os.environ['SPARK_HOME'] + '/python/pyspark')
import pyspark
import pandas as pd
from pyspark.sql import SQLContext
from pyspark.ml.classification import LogisticRegression
from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, VectorAssembler
from base import *


class LogisticRegressionWithSpark(EstimatorMixin):
    def __init__(self, *args):
        self.sc = pyspark.SparkContext("local[10]", "LGwS")
        self.sqlContext = SQLContext(self.sc)
        try:
            self.response_variable = args[0]
            self.explanatory_variables = args[2:] if args[1] == '~' or args[1].lower() == 'from' else args[1:]
            assert len(self.explanatory_variables) > 0
        except:
            raise Exception('Syntax error: Expected "<target> FROM <field> ...')
        response_indexer = StringIndexer(inputCol=self.response_variable, outputCol="label")
        assembler = VectorAssembler(
            inputCols=[x for x in self.columns],
            outputCol='features')
        lr = LogisticRegression(maxIter=10, regParam=0.01)
        self.pipeline = Pipeline(stages=[response_indexer, assembler, lr])

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
            print >> sys.stderr, 'Some fields are missing: ' + ', '.join(missing_columns)

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
	df[self.response_variable] = y
        df.to_pickle("/tmp/splunkDF")
        sparkDF = self.sqlContext.createDataFrame(df)
        self.model = self.pipeline.fit(sparkDF)

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
        sparkDF = self.sqlContext.createDataFrame(df)
        y_hat = self.estimator.transform(sparkDF).select("prediction").collect()
        
	output_name = 'predicted(%s)' % self.response_variable
        output = pd.DataFrame({output_name: np.empty(length)})
        output[output_name] = np.nan
        output.ix[~nans, output_name] = y_hat
        return output
