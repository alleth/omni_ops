import React, { useEffect, useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { startSessionTimer, resetSessionTimer } from '../../utils/session';

function MasterfileHome() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = sessionStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
            startSessionTimer(navigate);
        } else {
            navigate('/masterfile/login');
        }

        const handleActivity = () => resetSessionTimer(navigate);
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keypress', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keypress', handleActivity);
        };
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/masterfile/login');
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
                    <Card.Body className="p-8 text-center">
                        {/* Avatar */}
                        <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-bold text-white shadow-lg">
                            {user.fname[0]}{user.lname[0]}
                        </div>

                        {/* Name & Username */}
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">
                            {user.fname} {user.lname}
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">@{user.user_name}</p>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                            {user.region_assigned && (
                                <Badge bg="info" className="px-4 py-2 text-sm font-medium">
                                    Region {user.region_assigned}
                                </Badge>
                            )}
                            <Badge bg="success" className="px-4 py-2 text-sm font-medium">
                                {user.user_type}
                            </Badge>
                        </div>

                        {/* Logout Button */}
                        <Button
                            variant="outline-danger"
                            onClick={handleLogout}
                            className="w-full py-3 rounded-xl font-medium transition-all hover:bg-red-50 border-red-300 text-red-600 hover:text-red-700"
                        >
                            ← Logout
                        </Button>

                        {/* Footer */}
                        <p className="mt-6 text-xs text-gray-400">
                            FSE Masterfile — Hardware Inventory System
                        </p>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}

export default MasterfileHome;
