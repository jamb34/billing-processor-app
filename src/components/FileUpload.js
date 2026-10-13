import React, { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import config from '../amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(config);

const client = generateClient();

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      // Moved inside try/catch so an auth failure (expired session, no
      // logged-in user, etc.) is caught and surfaced via setMessage
      // instead of failing silently before uploading even starts.
      const { username } = await getCurrentUser();

      console.log('1. Starting S3 upload...');

      const s3Key = `uploads/${Date.now()}-${file.name}`;

      const uploadResult = await uploadData({
        key: s3Key,
        data: file,
        options: {
          contentType: file.type,
          metadata: { originalName: file.name }
        }
      }).result;

      console.log('2. S3 upload successful:', uploadResult);
      console.log('2a. S3 Key used:', s3Key);

      console.log('3. Attempting DynamoDB save...');

      const createFileMetadataMutation = `
        mutation CreateFileMetadata($input: CreateFileMetadataInput!) {
          createFileMetadata(input: $input) {
            id
            fileName
            status
            s3Key
          }
        }
      `;

      const variables = {
        input: {
          fileName: file.name,
          fileSize: file.size,
          s3Key: s3Key,
          status: 'UPLOADED',
          approvalStatus: 'PENDING',
          uploadDate: new Date().toISOString(),
          createdBy: username
        }
      };

      console.log('4. GraphQL variables:', variables);

      const dbResult = await client.graphql({
        query: createFileMetadataMutation,
        variables: variables
      });

      console.log('5. DynamoDB save successful:', dbResult);
      console.log('5a. File ID created:', dbResult.data.createFileMetadata.id);

      setMessage(`✅ File "${file.name}" uploaded! S3 + Database updated. Processing will start automatically...`);

    } catch (error) {
      console.error('=== FULL ERROR DETAILS ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);

      if (error.errors) {
        console.error('GraphQL errors:', error.errors);
        error.errors.forEach((err, index) => {
          console.error(`GraphQL error ${index}:`, err);
        });
      }

      if (error.message && error.message.includes('Network error')) {
        setMessage('❌ Network error - check internet connection');
      } else if (error.errors && error.errors[0] && error.errors[0].message) {
        setMessage(`❌ Database error: ${error.errors[0].message}`);
      } else {
        setMessage(`❌ Upload failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <h2>Upload File</h2>
      <div style={styles.uploadArea}>
        <input 
          type="file" 
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".csv,.xlsx,.xls"
          id="fileInput"
          style={styles.fileInput}
        />
        <label htmlFor="fileInput" style={styles.uploadLabel}>
          {uploading ? 'Uploading...' : 'Choose CSV or Excel File'}
        </label>
      </div>
      
      {message && (
        <div style={{
          ...styles.message,
          ...(message.includes('✅') ? styles.successMessage : styles.errorMessage)
        }}>
          {message}
        </div>
      )}
      
      <div style={styles.instructions}>
        <h3>Billing Processor:</h3>
        <p><strong>Upload a Sage extract</strong> - The file will be automatically processed when dropped into the tool</p>
        <p><strong>Go to the Processing Dashboard</strong> - View the status of your uploaded files</p>
        <p><strong>File collection</strong> - Download the files by clicking download next to the tile of your uploaded file</p>
        <p><strong>File inspection</strong> - View details of your processed files</p>
        <p><strong>Approve or reject</strong> - Approve or reject processed files in the dashboard tile</p>
        <p><strong>If approved, upload to box button</strong> - Select the upload option for approved files</p>
      </div>
    </div>
  );
};

// Styles object
const styles = {
  container: {
    border: '1px solid #e2e6ee',
    borderRadius: '12px',
    padding: '48px 40px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0 4px 24px rgba(18, 33, 67, 0.08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#2b3548',
  },
  uploadArea: {
    margin: '28px 0',
    padding: '32px 20px',
    backgroundColor: '#f5f7fb',
    border: '1px solid #e2e6ee',
    borderRadius: '10px',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#122143',
    color: '#ffffff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    boxShadow: '0 2px 8px rgba(18, 33, 67, 0.25)',
    transition: 'background-color 0.3s, box-shadow 0.3s, transform 0.2s',
  },
  message: {
    margin: '24px 0',
    padding: '14px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: 1.5,
    textAlign: 'left',
  },
  successMessage: {
    backgroundColor: '#e8f6ec',
    border: '1px solid #bfe3ca',
    borderLeft: '4px solid #2e9e57',
    color: '#1b5e35',
  },
  errorMessage: {
    backgroundColor: '#fdecee',
    border: '1px solid #f3c2c8',
    borderLeft: '4px solid #d9363e',
    color: '#8a1c23',
  },
  instructions: {
    marginTop: '32px',
    textAlign: 'left',
    backgroundColor: '#f9fafc',
    padding: '24px',
    borderRadius: '10px',
    border: '1px solid #e2e6ee',
    fontSize: '14px',
    lineHeight: 1.7,
    color: '#44506a',
  }
};

export default FileUpload;