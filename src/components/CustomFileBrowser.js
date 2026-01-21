import React, { useEffect, useState } from 'react';
import { list, getUrl } from 'aws-amplify/storage';

const SimpleFileBrowser = () => {
  const [status, setStatus] = useState('Testing S3 access...');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    testS3Access();
  }, []);

  const testS3Access = async () => {
    try {
      setStatus('🔍 Attempting to list files from S3...');
      
      const result = await list({
        prefix: 'outputs/',
        options: {
          listAll: true,
          bucket: 'billing-output-amh'
        }
      });

      setStatus('✅ SUCCESS! S3 access works!');
      setFiles(result.items || []);
      console.log('✅ Files found:', result);
      
    } catch (err) {
      setStatus('❌ FAILED - S3 access denied');
      setError(err.message);
      console.error('❌ Full error:', err);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>S3 Access Test</h1>
      
      <div style={{
        padding: '20px',
        backgroundColor: error ? '#f8d7da' : '#d4edda',
        border: `1px solid ${error ? '#f5c6cb' : '#c3e6cb'}`,
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>{status}</h2>
        {error && <p style={{ color: '#721c24' }}>Error: {error}</p>}
      </div>

      {files.length > 0 && (
        <div>
          <h3>Found {files.length} files:</h3>
          <ul>
            {files.slice(0, 10).map((file, i) => (
              <li key={i}>{file.key}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={testS3Access} style={{
        padding: '12px 24px',
        backgroundColor: '#122143',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      }}>
        Test Again
      </button>
    </div>
  );
};

export default SimpleFileBrowser;