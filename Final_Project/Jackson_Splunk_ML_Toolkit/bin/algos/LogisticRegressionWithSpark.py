#!/usr/bin/env python

from __future__ import print_function
#This code is a subclass of the Splunk Machine Learning Logisitic Regression class.  
#However, this class uses a Spark ML Pipeline to fit the logistic regression model, whereas the parent class uses sklearn.

import sys, os
import LogisticRegression 
from sklearn.linear_model import LogisticRegression as _LogisticRegression
from base import *
import pandas as pd
import numpy as np

#Import the Apache Spark libraries
os.environ['SPARK_HOME'] = os.environ['HOME']+'/spark15'
sys.path.append(os.environ['SPARK_HOME'] + '/python')
sys.path.append(os.environ['SPARK_HOME'] + '/python/lib/py4j-0.8.2.1-src.zip')
sys.path.append(os.environ['SPARK_HOME'] + '/python/pyspark')
import pyspark
from pyspark.sql import SQLContext
from pyspark.ml.classification import LogisticRegression as SparkLogisticRegression
from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, VectorAssembler        



class LogisticRegressionWithSpark(LogisticRegression.LogisticRegression):

#Inherits predict and summary functions from parent class

#Overrides the sklearn-backed method in the parent class
    def fit(self, df):
	#The following code is copied directly from the parent class.  This code cleans and prepares the data for regression
	# Make sure response_variable is present.
        if self.response_variable not in df:
            raise Exception('Response variable "%s" not present' % self.response_variable)

        # Limit the number of categories for classifiers.
        if 'is_classifier' in dir(self):
            n = df[self.response_variable].nunique()
            if n > 2:
                raise Exception('Response variable "%s" takes too many values: %d (max 2)' % (
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
	#End of copied code
        
	#The following code creates a Spark ML Pipeline and uses it to compute the logistic regression model
	sc = pyspark.SparkContext("local[15]", "LGwS")
	sqlContext = SQLContext(sc)
	df.columns = [str(self.columns.index(c)) for c in self.columns]
	indexNames = list(df.columns)
	df[self.response_variable] = y
        df.to_pickle("/tmp/splunkDF")
        sparkDF = sqlContext.createDataFrame(df)
	#Build Pipeline
	response_variable = self.response_variable
        response_indexer = StringIndexer(inputCol=response_variable, outputCol="label")
        assembler = VectorAssembler(
            inputCols= indexNames,
            outputCol='features')
        lr = SparkLogisticRegression()
        pipeline = Pipeline(stages=[response_indexer,assembler, lr])
        model = pipeline.fit(sparkDF) 

	#This code manually constructs a fitted sklearn LogisticRegression object.  
	#This is neccesary to preserve the parent class's other functionality, including prediction and serialization
	self.estimator.coef_ = np.array([model.stages[2].weights.toArray()])
	self.estimator.intercept_ = np.array([model.stages[2].intercept],ndmin=2)
	from pyspark.ml.feature import StringIndexerModel
	# Got from http://stackoverflow.com/questions/33636944/preserve-index-string-correspondence-spark-string-indexer
	# A simple monkey patch so we don't have to _call_java later 
	def labels(self): 
		return self._call_java("labels")

	StringIndexerModel.labels = labels 
	self.estimator.classes_ = np.array(model.stages[0].labels())



