import React from 'react';
import { StorageBrowser } from '@aws-amplify/ui-react-storage';

const SimpleFileBrowser = () => {
  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '20px auto', 
      padding: '20px',
      minHeight: '80vh'
    }}>
      <h1 style={{ color: '#122143', marginBottom: '10px' }}>
        Billing Files Browser
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Browse all billing output files in S3
      </p>
      
      <div style={{ 
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        minHeight: '600px'
      }}>
        <StorageBrowser
          // Use defaultValue to set starting location
          defaultValue={{
            bucket: "billing-output-amh",
            prefix: ""
          }}
          
          features={{
            upload: false,
            delete: false,
            createFolder: false,
            download: true,
            preview: true,
            search: true,
            breadcrumbs: true,
            gridView: true,
            listView: true
          }}
          
          onError={(error) => {
            console.error('Storage Browser error:', error);
            console.error('Full error details:', {
              name: error.name,
              message: error.message,
              code: error.code,
              stack: error.stack
            });
          }}
          
          onSuccess={(result) => {
            console.log('Storage Browser success:', result);
          }}
          
          // Add onLoad to see when component loads
          onLoad={() => {
            console.log('✅ StorageBrowser component loaded');
          }}
        />
      </div>
      
      <div style={{ 
        backgroundColor: '#e8f4f8', 
        color: '#0c5460',
        padding: '15px',
        borderRadius: '5px',
        border: '1px solid #bee5eb',
        marginTop: '20px',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Debug:</strong> Check browser console (F12) for logs. 
          If empty, verify Amplify Storage config in App.js.
        </p>
      </div>
    </div>
  );
};

export default SimpleFileBrowser;