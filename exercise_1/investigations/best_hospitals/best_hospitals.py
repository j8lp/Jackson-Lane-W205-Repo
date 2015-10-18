from pyspark import SparkContext
from pyspark.sql import *
from pyspark.sql.functions import rank, desc, asc
from pyspark.sql.types import Row, StructField, StructType, StringType, IntegerType
procedures = sqlContext.table("procedures")
hospitals = sqlContext.table("hospitals")
dataframe = hospitals.join(procedures,hospitals.providerid == procedures.providerid).drop(procedures.providerid)
window = Window.partitionBy("MeasureName").orderBy(asc("score"))
ranked = dataframe.select('ProviderID',"HospitalName","MeasureName",rank().over(window).alias("rank"))
result = ranked.groupby("ProviderID","HospitalName").sum('rank').orderBy(desc("sum(rank)"))
result.show(10,truncate=False)