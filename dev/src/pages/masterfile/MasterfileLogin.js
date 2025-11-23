import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function MasterfileLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://omniops.local/api/user-tbl/login', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_name: username, user_pass: password }),
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('user', JSON.stringify(data.user));
                navigate('/masterfile/home');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error — please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
            <Card className="w-full max-w-sm border border-gray-200 shadow-lg rounded-2xl bg-white">
                <Card.Body className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-gray-800">FSE Masterfile</h1>
                        <p className="text-sm text-gray-500 mt-1">Hardware Inventory System</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <Alert
                            variant="danger"
                            className="mb-5 p-4 border border-red-300 bg-red-50 text-red-700 rounded-lg shadow-sm"
                        >
                            <p className="text-sm font-medium">{error}</p>
                        </Alert>
                    )}

                    {/* Form */}
                    <Form onSubmit={handleSubmit} className="space-y-5">
                        <Form.Group>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full border border-gray-300 rounded-lg py-3 px-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                required
                                disabled={loading}
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full border border-gray-300 rounded-lg py-3 px-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                required
                                disabled={loading}
                            />
                        </Form.Group>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-60"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </Form>
                    {/* Back */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => navigate('/masterfile')}
                            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            ← Back to Home
                        </button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}

export default MasterfileLogin;
