import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './home';
import Stream from './stream';
import Assessment from './assessment';
import PeoplePage from './People';
import Login from './Login';
import Help from './Help';
import StudentChat from './StudentChat';


// Staff
import StaffHome from './Staff/StaffHome';
import StaffStream from './Staff/StaffStream';
import StaffAssessment from './Staff/StaffAssessment';
import StaffPeople from './Staff/StaffPeople';
import Admin  from './Admin'
import StaffHelp from './Staff/StaffHelp';
import StaffChat from './Staff/StaffChat';
import StudentloginDetails from './Staff/StudentloginDetails';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/home" element={<Home />} /> 
          <Route path="/stream/:classId" element={<Stream />} /> 
          <Route path="/stream" element={<Stream />} /> 
          <Route path="/assessment/:classId" element={<Assessment />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:classId" element={<PeoplePage />} />
          <Route path="/chat" element={<StudentChat />} />
          <Route path="/chat/:classId" element={<StudentChat />} />
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/help" element={<Help />} />
          

          {/* Staff */}
          <Route path="/staffhome" element={<StaffHome />} /> 
          <Route path="/staffstream" element={<StaffStream />} /> 
          <Route path="/staffstream/:classId" element={<StaffStream />} />
          <Route path="/staffassessment" element={<StaffAssessment />} /> 
          <Route path="/staffassessment/:classId" element={<StaffAssessment />} /> 
          <Route path="/staffpeople" element={<StaffPeople />} /> 
          <Route path="/staffpeople/:classId" element={<StaffPeople />} />
          <Route path="/staffchat" element={<StaffChat />} /> 
          <Route path="/staffchat/:classId" element={<StaffChat/>} />
          <Route path="/studentlogindetails/:classId" element={<StudentloginDetails />} />
          <Route path="/admin" element={<Admin/>} /> 
          <Route path="/staffhelp" element={<StaffHelp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
