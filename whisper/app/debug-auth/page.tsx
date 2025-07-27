"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function DebugAuthPage() {
  const { user, isLoaded } = useUser();
  const [apiResult, setApiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/auth-detailed');
      const data = await response.json();
      setApiResult(data);
    } catch (error) {
      setApiResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testLimits = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/test-limits');
      const data = await response.json();
      setApiResult(data);
    } catch (error) {
      setApiResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Client-side Authentication Status:</h2>
        <p><strong>User ID:</strong> {user?.id || 'Not authenticated'}</p>
        <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress || 'N/A'}</p>
        <p><strong>Is Loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
      </div>

      <div className="mb-6 space-x-4">
        <button 
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Server Auth'}
        </button>
        
        <button 
          onClick={testLimits}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Limits'}
        </button>
      </div>

      {apiResult && (
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">API Response:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 