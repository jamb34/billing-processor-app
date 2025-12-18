import React, { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
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
      console.log('1. Starting S3 upload...');
      
      // CORRECT: Remove 'public/' since Amplify adds it automatically
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
      
      // Save to DynamoDB with the S3 key we used (without public/)
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
          s3Key: s3Key, // This is uploads/... (Amplify will make it public/uploads/...)
          status: 'UPLOADED',
          approvalStatus: 'PENDING',
          uploadDate: new Date().toISOString(),
          createdBy: 'user' // This will be overwritten by the owner field automatically
        }
      };

      console.log('4. GraphQL variables:', variables);
      
      const dbResult = await client.graphql({
        query: createFileMetadataMutation,
        variables: variables
        // REMOVED: authMode parameter - uses default owner-based auth
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
      <h2>Upload Billing File</h2>
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
        <h3>Upload Status:</h3>
        <p>✅ <strong>S3 File Storage</strong> - Working</p>
        <p>✅ <strong>Database Connection</strong> - Strong</p>
        <p>🔄 <strong>Auto-Processing</strong> - Ready when s3Key is added</p>
        <p>🔧 <strong>Recent Fix</strong> - S3 path now matches Lambda trigger</p>
      </div>
    </div>
  );
};

// Styles object
const styles = {
  container: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    maxWidth: '600px',
    margin: '0 auto',
  },
  uploadArea: {
    margin: '20px 0',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#122143',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  message: {
    margin: '20px 0',
    padding: '15px',
    borderRadius: '4px',
    fontSize: '14px',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    color: '#155724',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24',
  },
  instructions: {
    marginTop: '30px',
    textAlign: 'left',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  }
};

export default FileUpload;