/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateFileMetadata = /* GraphQL */ `
  subscription OnCreateFileMetadata(
    $filter: ModelSubscriptionFileMetadataFilterInput
    $owner: String
  ) {
    onCreateFileMetadata(filter: $filter, owner: $owner) {
      id
      fileName
      fileSize
      status
      approvalStatus
      uploadDate
      processedDate
      approvedDate
      rejectedDate
      rejectionReason
      outputFiles {
        type
        s3Key
        fileName
        generatedDate
        __typename
      }
      createdBy
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateFileMetadata = /* GraphQL */ `
  subscription OnUpdateFileMetadata(
    $filter: ModelSubscriptionFileMetadataFilterInput
    $owner: String
  ) {
    onUpdateFileMetadata(filter: $filter, owner: $owner) {
      id
      fileName
      fileSize
      status
      approvalStatus
      uploadDate
      processedDate
      approvedDate
      rejectedDate
      rejectionReason
      outputFiles {
        type
        s3Key
        fileName
        generatedDate
        __typename
      }
      createdBy
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteFileMetadata = /* GraphQL */ `
  subscription OnDeleteFileMetadata(
    $filter: ModelSubscriptionFileMetadataFilterInput
    $owner: String
  ) {
    onDeleteFileMetadata(filter: $filter, owner: $owner) {
      id
      fileName
      fileSize
      status
      approvalStatus
      uploadDate
      processedDate
      approvedDate
      rejectedDate
      rejectionReason
      outputFiles {
        type
        s3Key
        fileName
        generatedDate
        __typename
      }
      createdBy
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
