import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Public pages
import LandingPage from './pages/LandingPage';
import MasterfileLanding from './pages/masterfile/MasterfileLanding';
import MasterfileLogin from './pages/masterfile/MasterfileLogin';

// Dashboard Layout & Pages — ALL WITH CORRECT DEFAULT EXPORTS
import MasterfileLayout from './pages/masterfile/MasterfileLayout';
import MasterfileDashboard from './pages/masterfile/MasterfileDashboard';
import MasterfileInventory from './pages/masterfile/MasterfileInventory';
import MasterfileDirectory from './pages/masterfile/MasterfileDirectory';
import MasterfileUsers from './pages/masterfile/MasterfileUsers';
import MasterfileManagement from './pages/masterfile/MasterfileHardwareManagement';
import MasterfileProfile from './pages/masterfile/MasterfileProfile';

function App() {
    return (
        <Router basename="/public">
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/masterfile" element={<MasterfileLanding />} />
                <Route path="/masterfile/login" element={<MasterfileLogin />} />

                {/* Protected Dashboard — All inside layout */}
                <Route element={<MasterfileLayout />}>
                    <Route path="/masterfile/home" element={<MasterfileDashboard />} />
                    <Route path="/masterfile/inventory" element={<MasterfileInventory />} />
                    <Route path="/masterfile/directory" element={<MasterfileDirectory />} />
                    <Route path="/masterfile/users" element={<MasterfileUsers />} />
                    <Route path="/masterfile/management" element={<MasterfileManagement />} />
                    <Route path="/masterfile/profile" element={<MasterfileProfile />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<LandingPage />} />
            </Routes>
        </Router>
    );
}

export default App;
