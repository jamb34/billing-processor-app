import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import config from '../amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(config);

const client = generateClient();

const FileDashboard = ({ user }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // ============================================
  // AUTO-DOWNLOAD SUBSCRIPTION (TEMPORARILY DISABLED)
  // ============================================
  useEffect(() => {
    console.log('🔔 Setting up auto-download subscription...');
    
    return () => {
      console.log('🔕 Cleaning up subscription');
    };
  }, []);

  // ============================================
  // EXISTING FETCH FILES USE EFFECT
  // ============================================
  useEffect(() => {
    console.log('🔄 FileDashboard mounted');
    fetchFiles();
  }, []);

  // ============================================
  // APPROVAL/DENIAL FUNCTIONS (NEW)
  // ============================================
  const handleApprove = async (fileId) => {
    try {
      console.log(`Approving file: ${fileId}`);
      
      const updateMutation = `
        mutation UpdateFileMetadata($input: UpdateFileMetadataInput!) {
          updateFileMetadata(input: $input) {
            id
            approvalStatus
            approvedDate
          }
        }
      `;
      
      const result = await client.graphql({
        query: updateMutation,
        variables: {
          input: {
            id: fileId,
            approvalStatus: 'APPROVED',
            approvedDate: new Date().toISOString()
          }
        }
      });
      
      console.log('✅ File approved:', result);
      fetchFiles(); // Refresh the list
      
    } catch (error) {
      console.error('❌ Error approving file:', error);
    }
  };

  const handleDeny = async (fileId) => {
    try {
      console.log(`Denying file: ${fileId}`);
      
      const updateMutation = `
        mutation UpdateFileMetadata($input: UpdateFileMetadataInput!) {
          updateFileMetadata(input: $input) {
            id
            approvalStatus
            rejectedDate
          }
        }
      `;
      
      const result = await client.graphql({
        query: updateMutation,
        variables: {
          input: {
            id: fileId,
            approvalStatus: 'REJECTED',
            rejectedDate: new Date().toISOString()
          }
        }
      });
      
      console.log('✅ File denied:', result);
      fetchFiles(); // Refresh the list
      
    } catch (error) {
      console.error('❌ Error denying file:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      console.log('🔍 Starting to fetch files...');
      setLoading(true);
      setError(null);
      
      // UPDATED QUERY - ADDED downloadUrls
      const query = `
        query ListFileMetadata {
          listFileMetadata(limit: 100) {
            items {
              id
              fileName
              status
              approvalStatus
              uploadDate
              createdBy
              # NEW FIELD ADDED:
              downloadUrls {
                fileName
                url
                s3Key
                type
              }
            }
          }
        }
      `;
      
      console.log('Attempting GraphQL query...');
      
      const result = await client.graphql({ 
        query: query
      });
      
      console.log('✅ GraphQL result:', result);
      
      if (result.data?.listFileMetadata?.items) {
        // Sort by upload date, newest first
        const sortedFiles = result.data.listFileMetadata.items.sort((a, b) => 
          new Date(b.uploadDate) - new Date(a.uploadDate)
        );
        
        console.log(`📁 Found ${sortedFiles.length} files`);
        setFiles(sortedFiles);
      } else {
        console.log('❌ No items in response');
        setFiles([]);
      }

    } catch (error) {
      console.error('❌ Error fetching files:', error);
      setError(error.message);
      
      if (error.errors) {
        console.error('First GraphQL error:', error.errors[0]);
        
        // Try fallback query with even fewer fields
        if (error.errors[0]?.message?.includes('non-nullable')) {
          console.log('Trying fallback query...');
          await fetchFilesFallback();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback query with absolute minimum fields
  const fetchFilesFallback = async () => {
    try {
      const fallbackQuery = `
        query ListFileMetadata {
          listFileMetadata(limit: 100) {
            items {
              id
              fileName
              uploadDate
            }
          }
        }
      `;
      
      const result = await client.graphql({ query: fallbackQuery });
      
      if (result.data?.listFileMetadata?.items) {
        const sortedFiles = result.data.listFileMetadata.items.sort((a, b) => 
          new Date(b.uploadDate) - new Date(a.uploadDate)
        );
        
        console.log(`📁 Fallback found ${sortedFiles.length} files`);
        setFiles(sortedFiles);
        setError('Loaded basic file info (some fields unavailable)');
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  };

  // Categorise files - with safe defaults
  const awaitingApproval = files.filter(f => 
    f.status === 'PROCESSED' && f.approvalStatus === 'PENDING'
  );
  
  const approvedFiles = files.filter(f => 
    f.approvalStatus === 'APPROVED'
  );
  
  const deniedFiles = files.filter(f => 
    f.approvalStatus === 'REJECTED'
  );
  
  const uploadedFiles = files.filter(f => 
    f.status === 'UPLOADED' || f.status === 'PROCESSING'
  );
  
  const processedFiles = files.filter(f => 
    f.status === 'PROCESSED'
  );

  // Filter files based on active selection
  const getFilteredFiles = () => {
    switch (activeFilter) {
      case 'AWAITING': return awaitingApproval;
      case 'APPROVED': return approvedFiles;
      case 'REJECTED': return deniedFiles;
      case 'UPLOADING': return uploadedFiles;
      case 'PROCESSED': return processedFiles;
      default: return files;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontSize: '18px',
        color: '#666'
      }}>
        🔄 Loading files...
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        margin: '20px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        color: '#721c24'
      }}>
        <h3>❌ Error Loading Files</h3>
        <p>{error}</p>
        <button 
          onClick={fetchFiles}
          style={{
            padding: '10px 15px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ============================================
  // UPDATED FILECARD COMPONENT WITH APPROVAL BUTTONS
  // ============================================
  const FileCard = ({ file, onApprove, onDeny }) => {
    // Safe rendering with fallbacks
    const fileName = file.fileName || 'Unnamed File';
    const uploadDate = file.uploadDate ? new Date(file.uploadDate).toLocaleString() : 'Unknown';
    const createdBy = file.createdBy || 'Unknown';
    const status = file.status || 'UNKNOWN';
    const approvalStatus = file.approvalStatus || 'PENDING';
    
    // Check if file has downloads
    const hasDownloads = file.downloadUrls && file.downloadUrls.length > 0;

    return (
      <div key={file.id} style={{
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e1e1e1',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#122143' }}>{fileName}</h4>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              <p style={{ margin: '2px 0' }}>
                <strong>Uploaded:</strong> {uploadDate}
                {createdBy && createdBy !== 'Unknown' && ` by ${createdBy}`}
              </p>
              {/* NEW: Download status info */}
              {file.status === 'PROCESSED' && hasDownloads && (
                <p style={{ margin: '2px 0', color: '#28a745', fontSize: '11px' }}>
                  ✅ {file.downloadUrls.length} files ready for download
                </p>
              )}
              {file.status === 'PROCESSED' && !hasDownloads && (
                <p style={{ margin: '2px 0', color: '#ffc107', fontSize: '11px' }}>
                  ⏳ Processing downloads...
                </p>
              )}
              <p style={{ margin: '2px 0', fontFamily: 'monospace', fontSize: '11px' }}>
                <strong>ID:</strong> {file.id.substring(0, 12)}...
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
            <span style={{
              padding: '4px 8px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: status === 'PROCESSED' ? '#28a745' : 
                               status === 'PROCESSING' ? '#ffc107' : 
                               status === 'FAILED' ? '#dc3545' : '#007bff'
            }}>
              {status}
            </span>
            
            {/* NEW: Download button for processed files */}
            {file.status === 'PROCESSED' && hasDownloads && (
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                backgroundColor: '#17a2b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onClick={() => {
                // Manual download trigger with delay
                file.downloadUrls.forEach((fileInfo, index) => {
                  setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = fileInfo.url;
                    link.download = fileInfo.fileName;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log(`Downloaded: ${fileInfo.fileName}`);
                  }, index * 300); // 300ms delay between each download
                });
              }}
              title={`Click to download ${file.downloadUrls.length} files`}
              >
                📥 Download ({file.downloadUrls.length})
              </span>
            )}
            
            {/* NEW: APPROVAL BUTTONS */}
            {file.status === 'PROCESSED' && file.approvalStatus === 'PENDING' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                <button
                  onClick={() => onApprove && onApprove(file.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => onDeny && onDeny(file.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  ❌ Deny
                </button>
              </div>
            )}
            
            <span style={{
              padding: '4px 8px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: approvalStatus === 'APPROVED' ? '#28a745' : 
                               approvalStatus === 'REJECTED' ? '#dc3545' : '#ffc107'
            }}>
              {approvalStatus}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📊 File Processing Dashboard</h2>
        <div>
          <button 
            onClick={fetchFiles}
            style={{
              padding: '10px 15px',
              backgroundColor: '#122143',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Refresh
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Total: {files.length} files
          </span>
        </div>
      </div>

      {/* Error warning if partial success */}
      {error && files.length > 0 && (
        <div style={{ 
          padding: '10px 15px', 
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#856404'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
        gap: '15px',
        marginBottom: '30px'
      }}>
        <StatCard 
          title="TOTAL FILES" 
          count={files.length} 
          color="#122143" 
          active={activeFilter === 'ALL'}
          onClick={() => setActiveFilter('ALL')}
        />
        <StatCard 
          title="AWAITING" 
          count={awaitingApproval.length} 
          color="#000000ff" 
          active={activeFilter === 'AWAITING'}
          onClick={() => setActiveFilter('AWAITING')}
        />
        <StatCard 
          title="APPROVED" 
          count={approvedFiles.length} 
          color="#28a745" 
          active={activeFilter === 'APPROVED'}
          onClick={() => setActiveFilter('APPROVED')}
        />
        <StatCard 
          title="REJECTED" 
          count={deniedFiles.length} 
          color="#dc3545" 
          active={activeFilter === 'REJECTED'}
          onClick={() => setActiveFilter('REJECTED')}
        />
        <StatCard 
          title="PROCESSED" 
          count={processedFiles.length} 
          color="#17a2b8" 
          active={activeFilter === 'PROCESSED'}
          onClick={() => setActiveFilter('PROCESSED')}
        />
      </div>

      {/* Files Display */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            color: '#122143', 
            margin: 0
          }}>
            {activeFilter === 'ALL' && '📁 All Files'}
            {activeFilter === 'AWAITING' && '⏳ Files Awaiting Approval'}
            {activeFilter === 'APPROVED' && '✅ Approved Files'}
            {activeFilter === 'REJECTED' && '❌ Rejected Files'}
            {activeFilter === 'PROCESSED' && '⚡ Processed Files'}
            <span style={{ fontSize: '14px', color: '#6c757d', marginLeft: '10px' }}>
              ({getFilteredFiles().length} files)
            </span>
          </h3>
          <div style={{ fontSize: '13px', color: '#6c757d' }}>
            Sorted by upload date (newest first)
          </div>
        </div>
        
        {getFilteredFiles().length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>No files found</h3>
            <p>
              {activeFilter === 'ALL' && 'Upload a file to get started'}
              {activeFilter === 'AWAITING' && 'No files awaiting approval'}
              {activeFilter === 'APPROVED' && 'No approved files'}
              {activeFilter === 'REJECTED' && 'No rejected files'}
              {activeFilter === 'PROCESSED' && 'No processed files'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {getFilteredFiles().map(file => (
              <FileCard 
                key={file.id} 
                file={file} 
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component (unchanged)
const StatCard = ({ title, count, color, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      padding: '15px', 
      backgroundColor: color, 
      color: 'white', 
      borderRadius: '8px', 
      textAlign: 'center',
      cursor: 'pointer',
      opacity: active ? 1 : 0.8,
      transform: active ? 'scale(1.02)' : 'scale(1)',
      transition: 'all 0.2s'
    }}
  >
    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{title}</h4>
    <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{count}</p>
  </div>
);

export default FileDashboard;