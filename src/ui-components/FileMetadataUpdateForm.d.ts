/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type FileMetadataUpdateFormInputValues = {
    fileName?: string;
    fileSize?: number;
    s3Key?: string;
    status?: string;
    approvalStatus?: string;
    uploadDate?: string;
    processedDate?: string;
    approvedDate?: string;
    rejectedDate?: string;
    rejectionReason?: string;
    createdBy?: string;
};
export declare type FileMetadataUpdateFormValidationValues = {
    fileName?: ValidationFunction<string>;
    fileSize?: ValidationFunction<number>;
    s3Key?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    approvalStatus?: ValidationFunction<string>;
    uploadDate?: ValidationFunction<string>;
    processedDate?: ValidationFunction<string>;
    approvedDate?: ValidationFunction<string>;
    rejectedDate?: ValidationFunction<string>;
    rejectionReason?: ValidationFunction<string>;
    createdBy?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type FileMetadataUpdateFormOverridesProps = {
    FileMetadataUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    fileName?: PrimitiveOverrideProps<TextFieldProps>;
    fileSize?: PrimitiveOverrideProps<TextFieldProps>;
    s3Key?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
    approvalStatus?: PrimitiveOverrideProps<SelectFieldProps>;
    uploadDate?: PrimitiveOverrideProps<TextFieldProps>;
    processedDate?: PrimitiveOverrideProps<TextFieldProps>;
    approvedDate?: PrimitiveOverrideProps<TextFieldProps>;
    rejectedDate?: PrimitiveOverrideProps<TextFieldProps>;
    rejectionReason?: PrimitiveOverrideProps<TextFieldProps>;
    createdBy?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type FileMetadataUpdateFormProps = React.PropsWithChildren<{
    overrides?: FileMetadataUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    fileMetadata?: any;
    onSubmit?: (fields: FileMetadataUpdateFormInputValues) => FileMetadataUpdateFormInputValues;
    onSuccess?: (fields: FileMetadataUpdateFormInputValues) => void;
    onError?: (fields: FileMetadataUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: FileMetadataUpdateFormInputValues) => FileMetadataUpdateFormInputValues;
    onValidate?: FileMetadataUpdateFormValidationValues;
} & React.CSSProperties>;
export default function FileMetadataUpdateForm(props: FileMetadataUpdateFormProps): React.ReactElement;
