import React from 'react';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded shadow p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">Back to Dashboard</button>
                </div>

                <div className="space-y-6">
                    <div className="border-b pb-4">
                        <h2 className="text-lg font-semibold mb-2">Account Information</h2>
                        <p className="text-gray-600">Username: {JSON.parse(localStorage.getItem('user'))?.username}</p>
                        <p className="text-gray-600">Email: {JSON.parse(localStorage.getItem('user'))?.email}</p>
                    </div>

                    <div className="border-b pb-4">
                        <h2 className="text-lg font-semibold mb-2">Preferences</h2>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="form-checkbox" />
                                <span>Enable Dark Mode</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-2 text-red-600">Danger Zone</h2>
                        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete Account</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
