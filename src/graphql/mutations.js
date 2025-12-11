/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createFileMetadata = /* GraphQL */ `
  mutation CreateFileMetadata(
    $input: CreateFileMetadataInput!
    $condition: ModelFileMetadataConditionInput
  ) {
    createFileMetadata(input: $input, condition: $condition) {
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
export const updateFileMetadata = /* GraphQL */ `
  mutation UpdateFileMetadata(
    $input: UpdateFileMetadataInput!
    $condition: ModelFileMetadataConditionInput
  ) {
    updateFileMetadata(input: $input, condition: $condition) {
      id
      fileName
      fileSize
      s3Key
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
export const deleteFileMetadata = /* GraphQL */ `
  mutation DeleteFileMetadata(
    $input: DeleteFileMetadataInput!
    $condition: ModelFileMetadataConditionInput
  ) {
    deleteFileMetadata(input: $input, condition: $condition) {
      id
      fileName
      fileSize
      s3Key
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
