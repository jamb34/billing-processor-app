// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const FileStatus = {
  "UPLOADED": "UPLOADED",
  "PROCESSING": "PROCESSING",
  "PROCESSED": "PROCESSED",
  "FAILED": "FAILED"
};

const ApprovalStatus = {
  "PENDING": "PENDING",
  "APPROVED": "APPROVED",
  "REJECTED": "REJECTED"
};

const { FileMetadata, OutputFile } = initSchema(schema);

export {
  FileMetadata,
  FileStatus,
  ApprovalStatus,
  OutputFile
};