DROP TABLE Hospitals;
CREATE TABLE Hospitals 
row format delimited
fields terminated by '\t'
stored as textfile
AS SELECT ProviderID, HospitalName, State FROM hospitalCSV;
quit;