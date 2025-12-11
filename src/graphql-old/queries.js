/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getFileMetadata = /* GraphQL */ `
  query GetFileMetadata($id: ID!) {
    getFileMetadata(id: $id) {
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
export const listFileMetadata = /* GraphQL */ `
  query ListFileMetadata(
    $filter: ModelFileMetadataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFileMetadata(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
        createdBy
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
