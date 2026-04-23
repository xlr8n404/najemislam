'use client';

import { useState } from 'react';

export default function MigrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    status?: string;
    error?: string;
  } | null>(null);

  const handleMigrate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-to-sharable-id', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        console.log('[v0] Migration completed successfully');
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Migration</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Username → Sharable ID Migration</h2>
          
          <p className="text-gray-600 mb-6">
            This migration will rename the &quot;username&quot; column to &quot;sharable_id&quot; 
            in the profiles table to better align with your app&apos;s branding.
          </p>

          <button
            onClick={handleMigrate}
            disabled={loading}
            className={`px-6 py-2 rounded font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {loading ? 'Migrating...' : 'Start Migration'}
          </button>
        </div>

        {result && (
          <div
            className={`rounded-lg p-6 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <h3 className={`font-semibold mb-2 ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? '✅ Success' : '❌ Error'}
            </h3>
            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message}
            </p>
            {result.status && (
              <p className={`mt-2 text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                Status: {result.status}
              </p>
            )}
            {result.error && (
              <p className="mt-2 text-sm text-red-600">
                Error: {result.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
