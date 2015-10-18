DROP TABLE Survey_Results;
CREATE TABLE Survey_Results 
row format delimited
fields terminated by '\t'
stored as textfile
AS SELECT ProviderNumber,  
(cast(HCAHPSConsistencyScore as int) +
cast(HCAHPSBaseScore as int)) as Score FROM surveys_responsesCSV where (cast(HCAHPSConsistencyScore as int) +
cast(HCAHPSBaseScore as int)) >  -1;
quit;