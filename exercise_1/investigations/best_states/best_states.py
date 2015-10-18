from pyspark import SparkContext
from pyspark.sql import *
from pyspark.sql.functions import rank, desc, asc
from pyspark.sql.types import Row, StructField, StructType, StringType, IntegerType
procedures = sqlContext.table("procedures")
hospitals = sqlContext.table("hospitals")
dataframe = hospitals.join(procedures,hospitals.providerid == procedures.providerid)
window = Window.partitionBy("MeasureName").orderBy(desc("score"))
ranked = dataframe.select('State',rank().over(window).alias("rank"))
result.show(10,truncate=False)

