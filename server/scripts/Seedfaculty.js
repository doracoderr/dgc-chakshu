/**
 * Clears ALL existing faculty and seeds 160 faculty members from DGC Gurugram
 * Each faculty is linked to their respective department by department name.
 * approvedForDisplay is set to true for all faculty members.
 * 
 * Usage:
 *   cd server
 *   node scripts/seedFaculty.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../src/models/Department');
const Faculty = require('../src/models/Faculty');

// Subject-to-Department mapping (from seedDepartments.js)
const SUBJECT_DEPT_MAP = {
  'Bio-Technology': 'Biotechnology',
  'Botany': 'Botany',
  'Chemistry': 'Chemistry',
  'Commerce': 'Commerce',
  'Computer Science': 'Computer Science',
  'Economics': 'Economics',
  'English': 'English',
  'Geography': 'Geography',
  'Hindi': 'Hindi',
  'History': 'History',
  'Management': 'Commerce', // Management courses under Commerce
  'Maths': 'Mathematics',
  'Philosophy': 'Philosophy',
  'Physical Education': 'Physical Education',
  'Physics': 'Physics',
  'Political Science': 'Political Science',
  'Psychology': 'Psychology',
  'Public Administration': 'Public Administration',
  'Sanskrit': 'Sanskrit',
  'Sociology': 'Sociology',
  'Zoology': 'Zoology',
};

// 160 faculty members from DGC Gurugram scraped from the website
const FACULTY_DATA = [
  { name: 'Neha Jain', designation: 'Extension Lecturer', subject: 'Bio-Technology', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2549_PP.jpg' },
  { name: 'Pushpa Yadav', designation: 'Extension Lecturer', subject: 'Bio-Technology', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2421_PP.jpg' },
  { name: 'Sujata Chauhan', designation: 'Extension Lecturer', subject: 'Bio-Technology', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2236_PP.jpg' },
  { name: 'Jyoti Singh', designation: 'Assistant Professor', subject: 'Botany', photo: 'https://mis.highereduhry.ac.in/EmpImages/11803.jpg' },
  { name: 'Madhu', designation: 'Assistant Professor', subject: 'Botany', photo: 'https://mis.highereduhry.ac.in/EmpImages/19076.jpg' },
  { name: 'Meenakshi  Arya', designation: 'Assistant Professor', subject: 'Botany', photo: 'https://mis.highereduhry.ac.in/EmpImages/19077.jpg' },
  { name: 'Naveena Dinodia', designation: 'Associate Professor', subject: 'Botany', photo: 'https://mis.highereduhry.ac.in/EmpImages/12638.jpg' },
  { name: 'Poonam Choudhary', designation: 'Assistant Professor', subject: 'Botany', photo: 'https://mis.highereduhry.ac.in/EmpImages/11808.jpg' },
  { name: 'Priyanka', designation: 'Assistant Professor', subject: 'Botany', photo: 'https://mis.highereduhry.ac.in/EmpImages/19180.jpg' },
  { name: 'Amit Gupta', designation: 'Extension Lecturer', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3259_PP.jpg' },
  { name: 'Anu Yadav', designation: 'Assistant Professor', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/EmpImages/12677.jpg' },
  { name: 'Dr. Madhusudan Goyal', designation: 'Assistant Professor', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/EmpImages/13168.jpg' },
  { name: 'Kavita Fulara', designation: 'Assistant Professor', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/EmpImages/19301.jpg' },
  { name: 'Lipika  Arora', designation: 'Assistant Professor', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/EmpImages/19398.jpg' },
  { name: 'Manju', designation: 'Extension Lecturer', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1725_PP.jpg' },
  { name: 'Manju Bala', designation: 'Extension Lecturer', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1544_PP.jpg' },
  { name: 'Pooja Rani', designation: 'Extension Lecturer', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1485_PP.jpg' },
  { name: 'Rajkumari Jadon', designation: 'Extension Lecturer', subject: 'Chemistry', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1413_PP.jpg' },
  { name: 'Anil Kumar', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/11772.jpg' },
  { name: 'Anjali', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/20290.jpg' },
  { name: 'Anju Bala', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1672_PP.jpg' },
  { name: 'Chetna Saini', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1917_PP.jpg' },
  { name: 'Dauly', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1595_PP.jpg' },
  { name: 'Dimpy Yadav', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1934_PP.jpg' },
  { name: 'Farhat', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2286_PP.jpg' },
  { name: 'Gagandeep', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1628_PP.jpg' },
  { name: 'Hansa Verma', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1354_PP.jpg' },
  { name: 'Heera Raparia', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/15667.jpg' },
  { name: 'Hemlata', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/20308.jpg' },
  { name: 'Inna', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1290_PP.jpg' },
  { name: 'Jyoti Yadav', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2376_PP.jpg' },
  { name: 'Komal Sharma', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/20307.jpg' },
  { name: 'Mansa Rani', designation: 'Guest Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1944_PP.jpg' },
  { name: 'Meenakshi', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3082_PP.jpg' },
  { name: 'Meenakshi Yadav', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3664_PP.jpg' },
  { name: 'Monika Tyagi', designation: 'Guest Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2422_PP.jpg' },
  { name: 'Nishu', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1781_PP.jpg' },
  { name: 'Payal Rani', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/11784.jpg' },
  { name: 'Pinky Harit', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/11700.jpg' },
  { name: 'Poonam Kapoor', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/11055.jpg' },
  { name: 'Poonam Sharma', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/11038.jpg' },
  { name: 'Praveen Kumar', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2278_PP.jpg' },
  { name: 'Priyanka Rani', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3004_PP.jpg' },
  { name: 'Puneet Ahuja', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1900_PP.jpg' },
  { name: 'Rashmi Ranga', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1404_PP.jpg' },
  { name: 'Ritu', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2765_PP.jpg' },
  { name: 'Ritu', designation: 'Assistant Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/15806.jpg' },
  { name: 'Satyapal Yadav', designation: 'Associate Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/11399.jpg' },
  { name: 'Shilpi Gupta', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1373_PP.jpg' },
  { name: 'Suresh', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2167_PP.jpg' },
  { name: 'Tarun Lata', designation: 'Associate Professor', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/EmpImages/12150.jpg' },
  { name: 'Varsha Bansal', designation: 'Guest Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1759_PP.jpg' },
  { name: 'Vikas Yadav', designation: 'Extension Lecturer', subject: 'Commerce', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1700_PP.jpg' },
  { name: 'Alka Malik', designation: 'Assistant Professor', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/13625.jpg' },
  { name: 'Devika Chhachhiya', designation: 'Assistant Professor', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/13606.jpg' },
  { name: 'Jyoti Yadav', designation: 'Assistant Professor', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/13568.jpg' },
  { name: 'Kusum Lata', designation: 'Guest Lecturer', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1072_PP.jpg' },
  { name: 'Mala Yadav', designation: 'Extension Lecturer', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2207_PP.jpg' },
  { name: 'Manish Kumar', designation: 'Assistant Professor', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/20199.jpg' },
  { name: 'Manoj Bala', designation: 'Guest Lecturer', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1052_PP.jpg' },
  { name: 'Nidhi Sharma', designation: 'Extension Lecturer', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1451_PP.jpg' },
  { name: 'Pinkey', designation: 'Guest Lecturer', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1647_PP.jpg' },
  { name: 'Reenu Rani', designation: 'Assistant Professor', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/20255.jpg' },
  { name: 'Seema Rani', designation: 'Assistant Professor', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/13628.jpg' },
  { name: 'Shefali Arora', designation: 'Extension Lecturer', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1557_PP.jpg' },
  { name: 'Sonika', designation: 'Assistant Professor', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/13630.jpg' },
  { name: 'Urmila Devi', designation: 'Assistant Professor', subject: 'Computer Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/13626.jpg' },
  { name: 'Aajam', designation: 'Extension Lecturer', subject: 'Economics', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2320_PP.jpg' },
  { name: 'Anjana Nagpal', designation: 'Associate Professor', subject: 'Economics', photo: 'https://mis.highereduhry.ac.in/EmpImages/12488.jpg' },
  { name: 'Archna Saini', designation: 'Extension Lecturer', subject: 'Economics', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1576_PP.jpg' },
  { name: 'Jyoti', designation: 'Extension Lecturer', subject: 'Economics', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3598_PP.jpg' },
  { name: 'Pradeep Yadav', designation: 'Extension Lecturer', subject: 'Economics', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/4015_PP.jpg' },
  { name: 'Subhash', designation: 'Assistant Professor', subject: 'Economics', photo: 'https://mis.highereduhry.ac.in/EmpImages/12223.jpg' },
  { name: 'Sushma Kumari', designation: 'Extension Lecturer', subject: 'Economics', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3971_PP.jpg' },
  { name: 'Amol Singh', designation: 'Assistant Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/15964.jpg' },
  { name: 'Ankita Rathee', designation: 'Assistant Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/15965.jpg' },
  { name: 'Jyoti Balhara', designation: 'Assistant Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/11584.jpg' },
  { name: 'Medhavini Yadav', designation: 'Assistant Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/15963.jpg' },
  { name: 'Namrata Joon', designation: 'Extension Lecturer', subject: 'English', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3819_PP.jpg' },
  { name: 'Pallavi Saxena', designation: 'Associate Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/11589.jpg' },
  { name: 'PRIYANKA LAMBA', designation: 'Associate Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/12494.jpg' },
  { name: 'Rajender Singh', designation: 'Associate Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/11722.jpg' },
  { name: 'Sangeeta Sharma', designation: 'Associate Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/11581.jpg' },
  { name: 'Sheetal', designation: 'Assistant Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/11986.jpg' },
  { name: 'Suman Sandhu', designation: 'Associate Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/12091.jpg' },
  { name: 'Vasudha Maitre', designation: 'Associate Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/11577.jpg' },
  { name: 'Vinita Sharma', designation: 'Associate Professor', subject: 'English', photo: 'https://mis.highereduhry.ac.in/EmpImages/11562.jpg' },
  { name: 'Inderdeep Singh', designation: 'Extension Lecturer', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2243_PP.jpg' },
  { name: 'Jyoti Yadav', designation: 'Assistant Professor', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/EmpImages/20209.jpg' },
  { name: 'Manisha', designation: 'Assistant Professor', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/EmpImages/20200.jpg' },
  { name: 'Manisha Rana', designation: 'Assistant/Associate Professor cum Officiating Principal', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/EmpImages/11418.jpg' },
  { name: 'Monica', designation: 'Assistant Professor', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/EmpImages/11407.jpg' },
  { name: 'Nisha Devi', designation: 'Extension Lecturer', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2302_PP.jpg' },
  { name: 'Pooja  Pal', designation: 'Assistant Professor', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/EmpImages/20202.jpg' },
  { name: 'Pratibha Choudhary', designation: 'Extension Lecturer', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1488_PP.jpg' },
  { name: 'Rahul Choudhary', designation: 'Extension Lecturer', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2692_PP.jpg' },
  { name: 'Tuba Athar', designation: 'Assistant Professor', subject: 'Geography', photo: 'https://mis.highereduhry.ac.in/EmpImages/20201.jpg' },
  { name: 'Beena Devi', designation: 'Extension Lecturer', subject: 'Hindi', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2391_PP.jpg' },
  { name: 'Deepak Yadav', designation: 'Extension Lecturer', subject: 'Hindi', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1967_PP.jpg' },
  { name: 'Seema Chaudhary', designation: 'Assistant Professor', subject: 'Hindi', photo: 'https://mis.highereduhry.ac.in/EmpImages/11496.jpg' },
  { name: 'Vaishali', designation: 'Extension Lecturer', subject: 'Hindi', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3684_PP.jpg' },
  { name: 'Vishal Kumar Yadav', designation: 'Extension Lecturer', subject: 'Hindi', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1208_PP.jpg' },
  { name: 'Yogesh Tyagi', designation: 'Assistant Professor', subject: 'Hindi', photo: 'https://mis.highereduhry.ac.in/EmpImages/15959.jpg' },
  { name: 'Kavita', designation: 'Extension Lecturer', subject: 'History', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3674_PP.jpg' },
  { name: 'Nitasha Joon', designation: 'Associate Professor', subject: 'History', photo: 'https://mis.highereduhry.ac.in/EmpImages/11678.jpg' },
  { name: 'Rajesh Kumar', designation: 'Extension Lecturer', subject: 'History', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2260_PP.jpg' },
  { name: 'Sakshi Tiwari', designation: 'Assistant Professor', subject: 'History', photo: 'https://mis.highereduhry.ac.in/EmpImages/17361.jpg' },
  { name: 'Sapna Yadav', designation: 'Extension Lecturer', subject: 'Management', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/4014_PP.jpg' },
  { name: 'Aarti Kadian', designation: 'Extension Lecturer', subject: 'Maths', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1040_PP.jpg' },
  { name: 'Anju Rani', designation: 'Extension Lecturer', subject: 'Maths', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1449_PP.jpg' },
  { name: 'Dr Surekha Devi', designation: 'Extension Lecturer', subject: 'Maths', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3896_PP.jpg' },
  { name: 'Manish Gautam', designation: 'Extension Lecturer', subject: 'Maths', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3831_PP.jpg' },
  { name: 'Minni Rani', designation: 'Extension Lecturer', subject: 'Maths', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3405_PP.jpg' },
  { name: 'Rakhi Yadav', designation: 'Extension Lecturer', subject: 'Maths', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1433_PP.jpg' },
  { name: 'Sushil Kumar', designation: 'Assistant Professor', subject: 'Maths', photo: 'https://mis.highereduhry.ac.in/EmpImages/12016.jpg' },
  { name: 'Vikasdeep Yadav', designation: 'Extension Lecturer', subject: 'Maths', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/1953_PP.jpg' },
  { name: 'Karamvir', designation: 'Assistant Professor', subject: 'Philosophy', photo: 'https://mis.highereduhry.ac.in/EmpImages/12009.jpg' },
  { name: 'Kavita', designation: 'Assistant Professor', subject: 'Physical Education', photo: 'https://mis.highereduhry.ac.in/EmpImages/11702.jpg' },
  { name: 'Priti Kumari', designation: 'Assistant Professor', subject: 'Physical Education', photo: 'https://mis.highereduhry.ac.in/EmpImages/19343.jpg' },
  { name: 'Rakesh Kumar', designation: 'Extension Lecturer', subject: 'Physical Education', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3665_PP.jpg' },
  { name: 'Sunil Dabas', designation: 'Associate Professor', subject: 'Physical Education', photo: 'https://mis.highereduhry.ac.in/EmpImages/11382.jpg' },
  { name: 'Anu Chauhan', designation: 'Extension Lecturer', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2427_PP.jpg' },
  { name: 'Chhatarpal', designation: 'Assistant Professor', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/EmpImages/12844.jpg' },
  { name: 'Dr Parminder Singh', designation: 'Assistant Professor', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/EmpImages/12695.jpg' },
  { name: 'Hritik Yadav', designation: 'Assistant Professor', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/EmpImages/19721.jpg' },
  { name: 'Innu', designation: 'Extension Lecturer', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2276_PP.jpg' },
  { name: 'Monika Malik', designation: 'Associate Professor', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/EmpImages/11292.jpg' },
  { name: 'Pooja', designation: 'Assistant Professor', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/EmpImages/12678.jpg' },
  { name: 'Priyanka', designation: 'Extension Lecturer', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2382_PP.jpg' },
  { name: 'Vivek', designation: 'Assistant Professor', subject: 'Physics', photo: 'https://mis.highereduhry.ac.in/EmpImages/12693.jpg' },
  { name: 'Dinesh Bera', designation: 'Assistant Professor', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/17002.jpg' },
  { name: 'Jatin', designation: 'Assistant Professor', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/19844.jpg' },
  { name: 'Kanwar Singh', designation: 'Extension Lecturer', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2180_PP.jpg' },
  { name: 'Kusum Lata', designation: 'Assistant Professor', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/12676.jpg' },
  { name: 'Raj Kumar Sharma', designation: 'Assistant Professor', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/12842.jpg' },
  { name: 'Rakesh Mundria', designation: 'Extension Lecturer', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3444_PP.jpg' },
  { name: 'Ravi Shankar', designation: 'Assistant Professor', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/17003.jpg' },
  { name: 'Suman Kataria', designation: 'Extension Lecturer', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2392_PP.jpg' },
  { name: 'Suman Lata', designation: 'Assistant Professor', subject: 'Political Science', photo: 'https://mis.highereduhry.ac.in/EmpImages/17004.jpg' },
  { name: 'Dr Laxmi Kataria', designation: 'Extension Lecturer', subject: 'Psychology', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2185_PP.jpg' },
  { name: 'Garima Yadav', designation: 'Assistant Professor', subject: 'Psychology', photo: 'https://mis.highereduhry.ac.in/EmpImages/12631.jpg' },
  { name: 'Gobind Singh', designation: 'Assistant Professor', subject: 'Psychology', photo: 'https://mis.highereduhry.ac.in/EmpImages/10160.jpg' },
  { name: 'Kanti Singh Pawar', designation: 'Extension Lecturer', subject: 'Psychology', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3809_PP.jpg' },
  { name: 'Ravi Rathee', designation: 'Assistant Professor', subject: 'Psychology', photo: 'https://mis.highereduhry.ac.in/EmpImages/17654.jpg' },
  { name: 'Ritu Rohila', designation: 'Associate Professor', subject: 'Psychology', photo: 'https://mis.highereduhry.ac.in/EmpImages/12633.jpg' },
  { name: 'Shivalik Yadav', designation: 'Associate Professor', subject: 'Psychology', photo: 'https://mis.highereduhry.ac.in/EmpImages/11428.jpg' },
  { name: 'Urvashi Chaudhary', designation: 'Associate Professor', subject: 'Psychology', photo: 'https://mis.highereduhry.ac.in/EmpImages/12632.jpg' },
  { name: 'Naveen Kumar', designation: 'Assistant Professor', subject: 'Public Administration', photo: 'https://mis.highereduhry.ac.in/EmpImages/12217.jpg' },
  { name: 'Ashok Kumar', designation: 'Extension Lecturer', subject: 'Sanskrit', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2287_PP.jpg' },
  { name: 'Manisha Devi', designation: 'Extension Lecturer', subject: 'Sanskrit', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3853_PP.jpg' },
  { name: 'Anubha Chaturvedi', designation: 'Extension Lecturer', subject: 'Sociology', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/3735_PP.jpg' },
  { name: 'Renu', designation: 'Assistant Professor', subject: 'Sociology', photo: 'https://mis.highereduhry.ac.in/EmpImages/11443.jpg' },
  { name: 'Sunita', designation: 'Extension Lecturer', subject: 'Sociology', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2314_PP.jpg' },
  { name: 'Vijay Dahiya', designation: 'Assistant Professor', subject: 'Sociology', photo: 'https://mis.highereduhry.ac.in/EmpImages/17680.jpg' },
  { name: 'Ankit Kumari', designation: 'Assistant Professor', subject: 'Zoology', photo: 'https://mis.highereduhry.ac.in/EmpImages/19222.jpg' },
  { name: 'Manisha Saini', designation: 'Assistant Professor', subject: 'Zoology', photo: 'https://mis.highereduhry.ac.in/EmpImages/10651.jpg' },
  { name: 'Pooja Yadav', designation: 'Extension Lecturer', subject: 'Zoology', photo: 'https://mis.highereduhry.ac.in/forms_MIS/EL/EmpImages/2190_PP.jpg' },
  { name: 'Preeti Yadav', designation: 'Assistant Professor', subject: 'Zoology', photo: 'https://mis.highereduhry.ac.in/EmpImages/19223.jpg' },
  { name: 'Seema Kumari', designation: 'Assistant Professor', subject: 'Zoology', photo: 'https://mis.highereduhry.ac.in/EmpImages/11810.jpg' },
  { name: 'Shivali Sharma', designation: 'Assistant Professor', subject: 'Zoology', photo: 'https://mis.highereduhry.ac.in/EmpImages/19196.jpg' },
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Run this from the server/ folder with a valid .env.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Remove existing faculty
  const existing = await Faculty.find({}, '_id name');
  if (existing.length) {
    await Faculty.deleteMany({});
    console.log(`Removed ${existing.length} existing faculty members.`);
  } else {
    console.log('No existing faculty found.');
  }

  // Fetch all departments for lookup
  const depts = await Department.find({}, '_id name code');
  const deptMap = {};
  depts.forEach((d) => {
    deptMap[d.name] = d._id;
  });

  console.log(`\nFound ${depts.length} departments in database.`);
  console.log('Department Map:', deptMap);

  let facCreated = 0;
  const failedFaculty = [];

  for (const fac of FACULTY_DATA) {
    // Map subject to department name
    const deptName = SUBJECT_DEPT_MAP[fac.subject];
    
    if (!deptName) {
      failedFaculty.push(`${fac.name} - Unknown subject: ${fac.subject}`);
      continue;
    }

    const deptId = deptMap[deptName];
    if (!deptId) {
      failedFaculty.push(`${fac.name} - Department not found: ${deptName}`);
      continue;
    }

    try {
      await Faculty.create({
        name: fac.name.trim(),
        designation: fac.designation.trim(),
        departmentId: deptId,
        photo: fac.photo.trim(),
        approvedForDisplay: true,
      });
      facCreated++;
      if (facCreated % 20 === 0) {
        console.log(`  Created ${facCreated} faculty members...`);
      }
    } catch (err) {
      failedFaculty.push(`${fac.name} - Error: ${err.message}`);
    }
  }

  console.log(`\n✅ Done. ${facCreated} faculty members created.`);
  
  if (failedFaculty.length > 0) {
    console.log(`\n⚠️  Failed to create ${failedFaculty.length} faculty members:`);
    failedFaculty.forEach((msg) => console.log(`  - ${msg}`));
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});