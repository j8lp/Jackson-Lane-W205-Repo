#Postgress, Hive Metastore, and Hadoop must all be running 
mkdir /data/exercise_1
mkdir /data/exercise_1/loading_and_modeling
mkdir /data/exercise_1/loading_and_modeling/hospital_compare
mkdir /data/exercise_1/loading_and_modeling/hospital_compare/hos
mkdir /data/exercise_1/loading_and_modeling/hospital_compare/eff
mkdir /data/exercise_1/loading_and_modeling/hospital_compare/rea
mkdir /data/exercise_1/loading_and_modeling/hospital_compare/sur
mkdir /data/exercise_1/loading_and_modeling/hospital_compare/mea
cd /data/exercise_1/loading_and_modeling
wget -O file.zip https://data.medicare.gov/views/bg9k-emty/files/Nqcy71p9Ss2RSBWDmP77H1DQXcyacr2khotGbDHHW_s?content_type=application%2Fzip%3B%20charset%3Dbinary&filename=Hospital_Revised_Flatfiles.zip 
wait
unzip -u file.zip
tail -n +2 "Hospital General Information.csv" > hospital_compare/hos/hospital.csv
tail -n +2 "Timely and Effective Care - Hospital.csv" >  hospital_compare/eff/effective_care.csv
tail -n +2 "Readmissions and Deaths - Hospital.csv" >  hospital_compare/rea/readmissions.csv
tail -n +2 "hvbp_hcahps_05_28_2015.csv" >  hospital_compare/sur/surveys_responses.csv
tail -n +2 "Measure Dates.csv" >  hospital_compare/mea/measuredates.csv

sudo -u hdfs hdfs dfs -mkdir /user
sudo -u hdfs hdfs dfs -mkdir /user/hdfs
sudo -u hdfs hdfs dfs -mkdir /user/hdfs/hospital_compare

sudo -u hdfs hdfs dfs -put hospital_compare/hos /user/hdfs/hospital_compare
sudo -u hdfs hdfs dfs -put hospital_compare/eff /user/hdfs/hospital_compare
sudo -u hdfs hdfs dfs -put hospital_compare/rea /user/hdfs/hospital_compare
sudo -u hdfs hdfs dfs -put hospital_compare/sur /user/hdfs/hospital_compare
sudo -u hdfs hdfs dfs -put hospital_compare/mea /user/hdfs/hospital_compare

sudo -u hdfs hdfs dfs -ls /user/hdfs/hospital_compare

