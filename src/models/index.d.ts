import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";

export enum FileStatus {
  UPLOADED = "UPLOADED",
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED"
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

type EagerOutputFile = {
  readonly type: string;
  readonly s3Key: string;
  readonly fileName: string;
  readonly generatedDate: string;
}

type LazyOutputFile = {
  readonly type: string;
  readonly s3Key: string;
  readonly fileName: string;
  readonly generatedDate: string;
}

export declare type OutputFile = LazyLoading extends LazyLoadingDisabled ? EagerOutputFile : LazyOutputFile

export declare const OutputFile: (new (init: ModelInit<OutputFile>) => OutputFile)

type EagerFileMetadata = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<FileMetadata, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly fileName: string;
  readonly fileSize?: number | null;
  readonly status: FileStatus | keyof typeof FileStatus;
  readonly approvalStatus: ApprovalStatus | keyof typeof ApprovalStatus;
  readonly uploadDate: string;
  readonly processedDate?: string | null;
  readonly approvedDate?: string | null;
  readonly rejectedDate?: string | null;
  readonly rejectionReason?: string | null;
  readonly outputFiles?: (OutputFile | null)[] | null;
  readonly createdBy: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyFileMetadata = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<FileMetadata, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly fileName: string;
  readonly fileSize?: number | null;
  readonly status: FileStatus | keyof typeof FileStatus;
  readonly approvalStatus: ApprovalStatus | keyof typeof ApprovalStatus;
  readonly uploadDate: string;
  readonly processedDate?: string | null;
  readonly approvedDate?: string | null;
  readonly rejectedDate?: string | null;
  readonly rejectionReason?: string | null;
  readonly outputFiles?: (OutputFile | null)[] | null;
  readonly createdBy: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type FileMetadata = LazyLoading extends LazyLoadingDisabled ? EagerFileMetadata : LazyFileMetadata

export declare const FileMetadata: (new (init: ModelInit<FileMetadata>) => FileMetadata) & {
  copyOf(source: FileMetadata, mutator: (draft: MutableModel<FileMetadata>) => MutableModel<FileMetadata> | void): FileMetadata;
}