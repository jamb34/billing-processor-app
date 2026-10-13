import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { post } from 'aws-amplify/api';
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

  const handleSendToBox = async (fileId) => {
  try {
    console.log(`📤 Sending file to Box: ${fileId}`);
    
    const restOperation = post({
      apiName: 'BoxUploadAPI',
      path: '/upload-to-box',
      options: {
        body: {
          file_id: fileId
        }
      }
    });

    const { body } = await restOperation.response;
    const response = await body.json();
    
    console.log('✅ Box upload response:', response);
    alert(`Successfully uploaded ${response.successCount} files to Box!`);
    fetchFiles();
    
  } catch (error) {
    console.error('❌ Error sending to Box:', error);
    
    // Check if it's a timeout - the upload might still succeed
    if (error.message?.includes('504') || error.response?.statusCode === 504) {
      alert('Upload is taking longer than expected. Check Box in a few minutes to verify the files uploaded successfully.');
    } else {
      alert('Failed to upload to Box. Check console for details.');
    }
  }
};

  // ============================================
  // FETCH FILES — NOW PAGINATES UNTIL nextToken IS NULL
  // ============================================
  const fetchFiles = async () => {
    try {
      console.log('🔍 Starting to fetch files...');
      setLoading(true);
      setError(null);

      // UPDATED QUERY - takes $limit / $nextToken as variables, and the
      // selection set now explicitly asks for `nextToken`. Without it in
      // the selection set, AppSync will never return it and the loop
      // below would always stop after page 1.
      const query = `
        query ListFileMetadata($limit: Int, $nextToken: String) {
          listFileMetadata(limit: $limit, nextToken: $nextToken) {
            items {
              id
              fileName
              status
              approvalStatus
              uploadDate
              createdBy
              boxUploaded
              boxUploadedAt
              downloadUrls {
                fileName
                url
                s3Key
                type
              }
            }
            nextToken
          }
        }
      `;

      let allItems = [];
      let nextToken = null;

      do {
        console.log('Attempting GraphQL query...', { nextToken });

        const result = await client.graphql({
          query: query,
          variables: { limit: 100, nextToken }
        });

        const page = result.data?.listFileMetadata;

        // Diagnostic logging — confirms whether a given page hit the
        // ~1MB DynamoDB Scan boundary and had more items waiting.
        console.log('✅ GraphQL page result:', {
          returnedItems: page?.items?.length,
          nextToken: page?.nextToken,
          hasMorePages: Boolean(page?.nextToken),
          errors: result.errors,
        });

        if (page?.items) {
          allItems = allItems.concat(page.items);
        }

        nextToken = page?.nextToken ?? null;
      } while (nextToken);

      // Sort by upload date, newest first
      const sortedFiles = allItems.sort((a, b) => 
        new Date(b.uploadDate) - new Date(a.uploadDate)
      );

      console.log(`📁 Found ${sortedFiles.length} files across all pages`);
      setFiles(sortedFiles);

    } catch (error) {
      console.error('❌ Error fetching files:', error);

      // AppSync can return BOTH partial `data` and `errors` together —
      // e.g. one bad field (like a malformed date) fails to serialize, but
      // every other item/field in the response is still valid. Use the
      // partial data if it's there instead of throwing it away.
      // Note: if the error happens on page 2+, this only recovers that
      // page's partial items — earlier pages already merged into
      // `allItems` above are lost along with them since `allItems` is
      // scoped to the try block. If you start seeing this in practice,
      // move `allItems`/`nextToken` above the try block so they survive
      // into the catch.
      const partialItems = error.data?.listFileMetadata?.items;

      if (partialItems && partialItems.length > 0) {
        const sortedFiles = partialItems.sort((a, b) =>
          new Date(b.uploadDate) - new Date(a.uploadDate)
        );

        console.log(`📁 Loaded ${sortedFiles.length} files despite partial errors`);
        setFiles(sortedFiles);
        setError('Some fields could not be loaded for one or more files (see console for details)');
      } else {
        setError(error.message);
      }

      if (error.errors) {
        console.error('First GraphQL error:', error.errors[0]);

        // Only fall back to the minimal query if we don't already have
        // usable partial data, and this looks like a field-availability
        // issue rather than a serialization issue on otherwise-good data.
        if (!partialItems && error.errors[0]?.message?.includes('non-nullable')) {
          console.log('Trying fallback query...');
          await fetchFilesFallback();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback query with absolute minimum fields — also paginates, since
  // the same 1MB Scan boundary applies here too (just with a much higher
  // item count before it's hit, given the tiny selection set).
  const fetchFilesFallback = async () => {
    try {
      const fallbackQuery = `
        query ListFileMetadata($limit: Int, $nextToken: String) {
          listFileMetadata(limit: $limit, nextToken: $nextToken) {
            items {
              id
              fileName
              uploadDate
            }
            nextToken
          }
        }
      `;

      let allItems = [];
      let nextToken = null;

      do {
        const result = await client.graphql({
          query: fallbackQuery,
          variables: { limit: 100, nextToken }
        });

        const page = result.data?.listFileMetadata;

        if (page?.items) {
          allItems = allItems.concat(page.items);
        }

        nextToken = page?.nextToken ?? null;
      } while (nextToken);

      const sortedFiles = allItems.sort((a, b) => 
        new Date(b.uploadDate) - new Date(a.uploadDate)
      );

      console.log(`📁 Fallback found ${sortedFiles.length} files across all pages`);
      setFiles(sortedFiles);
      setError('Loaded basic file info (some fields unavailable)');

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
        padding: '64px 40px', 
        textAlign: 'center',
        fontSize: '18px',
        color: '#666',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        🔄 Loading files...
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div style={{ 
        padding: '24px 28px', 
        margin: '24px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '12px',
        color: '#721c24',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        lineHeight: 1.5,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        <h3>❌ Error Loading Files</h3>
        <p>{error}</p>
        <button 
          onClick={fetchFiles}
          style={{
            padding: '10px 18px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '10px',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.3px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ============================================
  // UPDATED FILECARD COMPONENT WITH APPROVAL BUTTONS AND BOX UPLOAD
  // ============================================
  const FileCard = ({ file, onApprove, onDeny, onSendToBox }) => {
    // Safe rendering with fallbacks
    const fileName = file.fileName || 'Unnamed File';
    const uploadDate = file.uploadDate ? new Date(file.uploadDate).toLocaleString() : 'Unknown';
    const createdBy = file.createdBy || 'Unknown';
    const status = file.status || 'UNKNOWN';
    const approvalStatus = file.approvalStatus || 'PENDING';
    
    // Check if file has downloads
    const hasDownloads = file.downloadUrls && file.downloadUrls.length > 0;

    // Box upload status
    const isInBox = file.boxUploaded === true;
    const boxUploadedAt = file.boxUploadedAt
      ? new Date(file.boxUploadedAt).toLocaleString()
      : null;

    return (
      <div key={file.id} style={{
        padding: '20px 24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e1e1e1',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#122143', fontSize: '16px', fontWeight: 600 }}>{fileName}</h4>
            <div style={{ fontSize: '12px', color: '#6c757d', lineHeight: 1.6 }}>
              <p style={{ margin: '3px 0' }}>
                <strong>Uploaded:</strong> {uploadDate}
                {createdBy && createdBy !== 'Unknown' && ` by ${createdBy}`}
              </p>

              {/* NEW: Download status info */}
              {file.status === 'PROCESSED' && hasDownloads && (
                <p style={{ margin: '3px 0', color: '#28a745', fontSize: '11px', fontWeight: 600 }}>
                  ✅ {file.downloadUrls.length} files ready for download
                </p>
              )}
              {file.status === 'PROCESSED' && !hasDownloads && (
                <p style={{ margin: '3px 0', color: '#ffc107', fontSize: '11px', fontWeight: 600 }}>
                  ⏳ Processing downloads...
                </p>
              )}

              {/* NEW: Box status line */}
              <p style={{ margin: '3px 0' }}>
                <strong>Box:</strong>{' '}
                {isInBox
                  ? `Uploaded${boxUploadedAt ? ` on ${boxUploadedAt}` : ''}`
                  : 'Not uploaded'}
              </p>

              <p style={{ margin: '3px 0', fontFamily: 'monospace', fontSize: '11px' }}>
                <strong>ID:</strong> {file.id.substring(0, 12)}...
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '999px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.4px',
              backgroundColor: status === 'PROCESSED' ? '#28a745' : 
                               status === 'PROCESSING' ? '#ffc107' : 
                               status === 'FAILED' ? '#dc3545' : '#007bff'
            }}>
              {status}
            </span>
            
            {/* NEW: Download button for processed files */}
            {file.status === 'PROCESSED' && hasDownloads && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '999px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.4px',
                backgroundColor: '#17a2b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
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
                Download ({file.downloadUrls.length})
              </span>
            )}
            
            {/* NEW: APPROVAL BUTTONS */}
            {file.status === 'PROCESSED' && file.approvalStatus === 'PENDING' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                <button
                  onClick={() => onApprove && onApprove(file.id)}
                  style={{
                    padding: '7px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    letterSpacing: '0.3px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => onDeny && onDeny(file.id)}
                  style={{
                    padding: '7px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    letterSpacing: '0.3px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                  }}
                >
                  ❌ Deny
                </button>
              </div>
            )}
            
            {/* Send to Box button - only show for APPROVED files */}
            {file.approvalStatus === 'APPROVED' && (
              <button
                onClick={() => onSendToBox && onSendToBox(file.id)}
                style={{
                  padding: '7px 16px',
                  backgroundColor: '#0061D5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  letterSpacing: '0.3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  marginTop: '5px'
                }}
              >
                Send to Box
              </button>
            )}
            
            <span style={{
              padding: '4px 12px',
              borderRadius: '999px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.4px',
              backgroundColor: approvalStatus === 'APPROVED' ? '#28a745' : 
                               approvalStatus === 'REJECTED' ? '#dc3545' : '#ffc107'
            }}>
              {approvalStatus}
            </span>

            {/* NEW: "In Box" badge — only shows when file is in Box */}
            {isInBox && (
              <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.4px',
                color: 'white',
                backgroundColor: '#0061d5'
              }}>
                In Box
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: '32px 24px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 600 }}>File Processing Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={fetchFiles}
            style={{
              padding: '10px 18px',
              backgroundColor: '#122143',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '14px',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.3px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
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
          padding: '14px 18px', 
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#856404',
          fontSize: '14px',
          lineHeight: 1.5
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
        gap: '16px',
        marginBottom: '36px'
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
            margin: 0,
            fontSize: '20px',
            fontWeight: 600
          }}>
            {activeFilter === 'ALL' && '📁 All Files'}
            {activeFilter === 'AWAITING' && 'Files Awaiting Approval'}
            {activeFilter === 'APPROVED' && 'Approved Files'}
            {activeFilter === 'REJECTED' && 'Rejected Files'}
            {activeFilter === 'PROCESSED' && 'Processed Files'}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#6c757d', marginLeft: '10px' }}>
              ({getFilteredFiles().length} files)
            </span>
          </h3>
          <div style={{ fontSize: '13px', color: '#6c757d' }}>
            Sorted by upload date (newest first)
          </div>
        </div>
        
        {getFilteredFiles().length === 0 ? (
          <div style={{ 
            padding: '56px 40px', 
            textAlign: 'center', 
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
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
          <div style={{ display: 'grid', gap: '16px' }}>
            {getFilteredFiles().map(file => (
              <FileCard 
                key={file.id} 
                file={file} 
                onApprove={handleApprove}
                onDeny={handleDeny}
                onSendToBox={handleSendToBox}
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
      padding: '20px 15px', 
      backgroundColor: color, 
      color: 'white', 
      borderRadius: '12px', 
      textAlign: 'center',
      cursor: 'pointer',
      opacity: active ? 1 : 0.8,
      transform: active ? 'scale(1.02)' : 'scale(1)',
      boxShadow: active ? '0 6px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.12)',
      transition: 'all 0.2s'
    }}
  >
    <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 600, letterSpacing: '0.8px' }}>{title}</h4>
    <p style={{ fontSize: '30px', fontWeight: 'bold', margin: 0 }}>{count}</p>
  </div>
);

export default FileDashboard;