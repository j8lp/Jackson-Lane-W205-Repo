DROP TABLE hospitalCSV;
CREATE EXTERNAL TABLE hospitalCSV (ProviderID varchar(500), HospitalName varchar(500), Address varchar(500), City varchar(500), State varchar(500), ZIPCode varchar(500), CountyName varchar(500), PhoneNumber varchar(500), HospitalType varchar(500),HospitalOwnership varchar(500), EmergencyServices varchar(500))
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
STORED AS TEXTFILE
LOCATION '/user/hdfs/hospital_compare/hos';

DROP TABLE surveys_responsesCSV;
CREATE EXTERNAL TABLE surveys_responsesCSV
(ProviderNumber varchar(500), HospitalName varchar(500), Address varchar(500),City varchar(500), State varchar(500), ZIPCode varchar(500),CountyName varchar(500),CommunicationwithNursesAchievementPoints varchar(500), CommunicationwithNursesImprovementPoints varchar(500),CommunicationwithNursesDimensionScore varchar(500), CommunicationwithDoctorsAchievementPoints varchar(500),CommunicationwithDoctorsImprovementPoints varchar(500),CommunicationwithDoctorsDimensionScore varchar(500), ResponsivenessofHospitalStaffAchievementPoints varchar(500), ResponsivenessofHospitalStaffImprovementPoints varchar(500), ResponsivenessofHospitalStaffDimensionScore varchar(500), PainManagementAchievementPoints varchar(500),PainManagementImprovementPoints varchar(500), PainManagementDimensionScore varchar(500),CommunicationaboutMedicinesAchievementPoints varchar(500),CommunicationaboutMedicinesImprovementPoints varchar(500),CommunicationaboutMedicinesDimensionScore varchar(500),CleanlinessandQuietnessofHospitalEnvironmentAchievementPoints varchar(500),CleanlinessandQuietnessofHospitalEnvironmentImprovementPoints varchar(500),CleanlinessandQuietnessofHospitalEnvironmentDimensionScore varchar(500),DischargeInformationAchievementPoints varchar(500),DischargeInformationImprovementPoints varchar(500),DischargeInformationDimensionScore varchar(500),OverallRatingofHospitalAchievementPoints varchar(500),OverallRatingofHospitalImprovementPoints varchar(500),OverallRatingofHospitalDimensionScore varchar(500),HCAHPSBaseScore varchar(500),HCAHPSConsistencyScore varchar(500))
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
STORED AS TEXTFILE
LOCATION '/user/hdfs/hospital_compare/sur';


DROP TABLE effective_careCSV;
CREATE EXTERNAL TABLE effective_careCSV (ProviderID varchar(500), HospitalName varchar(500), Address varchar(500), City varchar(500), State varchar(500), ZIPCode varchar(500), CountyName varchar(500), PhoneNumber varchar(500), Condition varchar(500), MeasureID varchar(500), MeasureName varchar(500), Score varchar(500), Sample varchar(500), Footnote varchar(500), MeasureStartDate varchar(500), MeasureEndDate varchar(500))
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
STORED AS TEXTFILE
LOCATION '/user/hdfs/hospital_compare/eff';


DROP TABLE readmissionsCSV;
CREATE EXTERNAL TABLE readmissionsCSV (ProviderID varchar(500), HospitalName varchar(500),	Address varchar(500), City varchar(500), State varchar(500), ZIPCode varchar(500), CountyName varchar(500),PhoneNumber varchar(500), MeasureName varchar(500), MeasureID varchar(500), ComparedtoNational varchar(500),Denominator varchar(500),Score varchar(500), LowerEstimate varchar(500), HigherEstimate varchar(500), Footnote varchar(500), MeasureStartDate varchar(500), MeasureEndDate varchar(500))
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
stored as textfile
LOCATION '/user/hdfs/hospital_compare/rea';

DROP TABLE measuredatesCSV;
CREATE EXTERNAL TABLE measuredatesCSV (MeasureName varchar(500), MeasureID varchar(500), MeasureStartQuarter varchar(500), MeasureStartDate varchar(500), MeasureEndQuarter varchar(500), MeasureEndDate varchar(500))
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
STORED AS TEXTFILE
LOCATION '/user/hdfs/hospital_compare/mea';

quit;