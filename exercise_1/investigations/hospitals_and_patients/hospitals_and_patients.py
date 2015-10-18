from pyspark import SparkContext
from pyspark.sql import *
procedures = sqlContext.table("procedures")
surveys = sqlContext.table("survey_results")
averagescores = sqlContext.sql("select providerid, avg(score) as hospital_quality_score from procedures group by providerid")
varianceGood = sqlContext.sql("select providerid, variance(score) as varianceGood from procedures where score > 0 group by providerid")
varianceBad = sqlContext.sql("select providerid, variance(score) as varianceBad from procedures where score < 0 group by providerid")
df = surveys.join(averagescores, surveys.providernumber == averagescores.providerid).drop(averagescores.providerid).join(varianceGood,surveys.providernumber == varianceGood.providerid).drop(varianceGood.providerid).join(varianceBad, surveys.providernumber == varianceBad.providerid).drop(varianceBad.providerid)
result = Row(Correlation_between_hospital_quality_scores_and_survey_scores = df.corr("hospital_quality_score","score"), Correlation_between_procedure_variance_and_survey_scores =df.corr("varianceGood","score"),  Correlation_between_readmissionsdeathrates_variance_and_survey_scores=df.corr("varianceBad","score"))
print(result)
