DROP TABLE Procedures;
CREATE TABLE Procedures 
row format delimited
fields terminated by '\t'
stored as textfile
AS SELECT ProviderID, MeasureName, cast(Score as  decimal(7,2)) as Score FROM effective_careCSV where cast(Score as decimal(7,2)) > -1 UNION ALL
SELECT ProviderID, MeasureName, cast(Score as  decimal(7,2)) * -1 as Score FROM readmissionsCSV where cast(Score as  decimal(7,2)) > -1;