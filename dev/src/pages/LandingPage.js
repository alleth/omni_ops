// src/pages/LandingPage.js
import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { UserGroupIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
            <div className="max-w-7xl w-full">
                <div className="text-center mb-16">
                    <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4 animate-pulse">
                        All-In-One App
                    </h1>
                    <p className="text-2xl text-gray-300 font-light">A CSG - Field Services Department Project — built to simplify and empower your workflow.</p>
                </div>

                {/* Horizontal Cards */}
                <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
                    {/* Masterfile Card */}
                    <Link to="/masterfile" className="flex-1 max-w-md">
                        <Card className="h-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-105 rounded-3xl overflow-hidden group">
                            <Card.Body className="p-10 text-center flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                                    <UserGroupIcon className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">FSE Masterfile</h3>
                                <p className="text-gray-300 mb-6 text-lg">
                                    Hardware inventory, user access, and field service management.
                                </p>
                                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg">
                                    Enter FSE Masterfile →
                                </Button>
                            </Card.Body>
                        </Card>
                    </Link>

                    {/* LAMD Card */}
                    <div className="flex-1 max-w-md">
                        <Card className="h-full bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-3xl overflow-hidden opacity-80">
                            <Card.Body className="p-10 text-center flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-800 rounded-3xl flex items-center justify-center mb-6">
                                    <WrenchScrewdriverIcon className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-400 mb-4">LAMD</h3>
                                <p className="text-gray-500 mb-6 text-lg">
                                    Logistics & Asset Management Dashboard
                                </p>
                                <Button disabled className="w-full bg-gray-700 text-gray-400 font-bold py-4 rounded-2xl cursor-not-allowed">
                                    Coming Soon
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                <p className="text-center mt-16 text-gray-400 text-sm">
                    &copy; 2025 All-In-One App. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default LandingPage;
