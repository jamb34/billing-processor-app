import React from 'react';
import { generateClient } from 'aws-amplify/api';
import * as mutations from '../graphql/mutations';
import { Amplify } from 'aws-amplify';
import config from '../amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(config);

const client = generateClient();

const FileApproval = ({ file, user, onApprovalUpdate }) => {
  
  const approveFile = async () => {
    try {
      // Use user.username or fallback to 'system' if user is undefined
      const approvedBy = user?.username || 'system';
      
      // REMOVED: authMode parameter - uses default owner-based auth
      await client.graphql({
        query: mutations.updateFileMetadata,
        variables: {
          input: {
            id: file.id,
            approvalStatus: 'APPROVED',
            approvedBy: approvedBy,
            approvedDate: new Date().toISOString()
          }
        }
        // REMOVED: authMode: 'apiKey'
      });
      console.log(`File ${file.id} approved by ${approvedBy}`);
      if (onApprovalUpdate) onApprovalUpdate();
    } catch (error) {
      console.error('Error approving file:', error);
      alert('Error approving file: ' + error.message);
    }
  };

  const rejectFile = async () => {
    const reason = prompt('Please provide rejection reason:');
    if (!reason || reason.trim() === '') {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      // Use user.username or fallback to 'system' if user is undefined
      const rejectedBy = user?.username || 'system';
      
      // REMOVED: authMode parameter - uses default owner-based auth
      await client.graphql({
        query: mutations.updateFileMetadata,
        variables: {
          input: {
            id: file.id,
            approvalStatus: 'REJECTED',
            rejectedBy: rejectedBy,
            rejectedDate: new Date().toISOString(),
            rejectionReason: reason
          }
        }
        // REMOVED: authMode: 'apiKey'
      });
      console.log(`File ${file.id} rejected by ${rejectedBy}`);
      if (onApprovalUpdate) onApprovalUpdate();
    } catch (error) {
      console.error('Error rejecting file:', error);
      alert('Error rejecting file: ' + error.message);
    }
  };

  if (file.status !== 'PROCESSED' || file.approvalStatus !== 'PENDING') {
    return null;
  }

  return (
    <div style={styles.container}>
      <h5>🔄 Approval Required</h5>
      <div style={styles.approvalActions}>
        <button 
          onClick={approveFile}
          style={styles.approveButton}
        >
          ✅ Approve
        </button>
        <button 
          onClick={rejectFile}
          style={styles.rejectButton}
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '6px'
  },
  approvalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  approveButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  rejectButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default FileApproval;