import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MasterfileLanding from './pages/masterfile/MasterfileLanding';
import MasterfileLogin from './pages/masterfile/MasterfileLogin';
import MasterfileHome from './pages/masterfile/MasterfileHome';

function App() {
    return (
        <Router basename="/public">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/masterfile" element={<MasterfileLanding />} />
                <Route path="/masterfile/login" element={<MasterfileLogin />} />
                <Route path="/masterfile/home" element={<MasterfileHome />} />
                <Route path="*" element={<LandingPage />} />
            </Routes>
        </Router>
    );
}

export default App;
