/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  SelectField,
  TextField,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { getFileMetadata } from "../../scr/graphql/queries";
import { updateFileMetadata } from "../../scr/graphql/mutations";
const client = generateClient();
export default function FileMetadataUpdateForm(props) {
  const {
    id: idProp,
    fileMetadata: fileMetadataModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    fileName: "",
    fileSize: "",
    s3Key: "",
    status: "",
    approvalStatus: "",
    uploadDate: "",
    processedDate: "",
    approvedDate: "",
    rejectedDate: "",
    rejectionReason: "",
    createdBy: "",
  };
  const [fileName, setFileName] = React.useState(initialValues.fileName);
  const [fileSize, setFileSize] = React.useState(initialValues.fileSize);
  const [s3Key, setS3Key] = React.useState(initialValues.s3Key);
  const [status, setStatus] = React.useState(initialValues.status);
  const [approvalStatus, setApprovalStatus] = React.useState(
    initialValues.approvalStatus
  );
  const [uploadDate, setUploadDate] = React.useState(initialValues.uploadDate);
  const [processedDate, setProcessedDate] = React.useState(
    initialValues.processedDate
  );
  const [approvedDate, setApprovedDate] = React.useState(
    initialValues.approvedDate
  );
  const [rejectedDate, setRejectedDate] = React.useState(
    initialValues.rejectedDate
  );
  const [rejectionReason, setRejectionReason] = React.useState(
    initialValues.rejectionReason
  );
  const [createdBy, setCreatedBy] = React.useState(initialValues.createdBy);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = fileMetadataRecord
      ? { ...initialValues, ...fileMetadataRecord }
      : initialValues;
    setFileName(cleanValues.fileName);
    setFileSize(cleanValues.fileSize);
    setS3Key(cleanValues.s3Key);
    setStatus(cleanValues.status);
    setApprovalStatus(cleanValues.approvalStatus);
    setUploadDate(cleanValues.uploadDate);
    setProcessedDate(cleanValues.processedDate);
    setApprovedDate(cleanValues.approvedDate);
    setRejectedDate(cleanValues.rejectedDate);
    setRejectionReason(cleanValues.rejectionReason);
    setCreatedBy(cleanValues.createdBy);
    setErrors({});
  };
  const [fileMetadataRecord, setFileMetadataRecord] = React.useState(
    fileMetadataModelProp
  );
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await client.graphql({
              query: getFileMetadata.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getFileMetadata
        : fileMetadataModelProp;
      setFileMetadataRecord(record);
    };
    queryData();
  }, [idProp, fileMetadataModelProp]);
  React.useEffect(resetStateValues, [fileMetadataRecord]);
  const validations = {
    fileName: [{ type: "Required" }],
    fileSize: [],
    s3Key: [{ type: "Required" }],
    status: [{ type: "Required" }],
    approvalStatus: [{ type: "Required" }],
    uploadDate: [{ type: "Required" }],
    processedDate: [],
    approvedDate: [],
    rejectedDate: [],
    rejectionReason: [],
    createdBy: [{ type: "Required" }],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  const convertToLocal = (date) => {
    const df = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          fileName,
          fileSize: fileSize ?? null,
          s3Key,
          status,
          approvalStatus,
          uploadDate,
          processedDate: processedDate ?? null,
          approvedDate: approvedDate ?? null,
          rejectedDate: rejectedDate ?? null,
          rejectionReason: rejectionReason ?? null,
          createdBy,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await client.graphql({
            query: updateFileMetadata.replaceAll("__typename", ""),
            variables: {
              input: {
                id: fileMetadataRecord.id,
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "FileMetadataUpdateForm")}
      {...rest}
    >
      <TextField
        label="File name"
        isRequired={true}
        isReadOnly={false}
        value={fileName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              fileName: value,
              fileSize,
              s3Key,
              status,
              approvalStatus,
              uploadDate,
              processedDate,
              approvedDate,
              rejectedDate,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.fileName ?? value;
          }
          if (errors.fileName?.hasError) {
            runValidationTasks("fileName", value);
          }
          setFileName(value);
        }}
        onBlur={() => runValidationTasks("fileName", fileName)}
        errorMessage={errors.fileName?.errorMessage}
        hasError={errors.fileName?.hasError}
        {...getOverrideProps(overrides, "fileName")}
      ></TextField>
      <TextField
        label="File size"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={fileSize}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize: value,
              s3Key,
              status,
              approvalStatus,
              uploadDate,
              processedDate,
              approvedDate,
              rejectedDate,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.fileSize ?? value;
          }
          if (errors.fileSize?.hasError) {
            runValidationTasks("fileSize", value);
          }
          setFileSize(value);
        }}
        onBlur={() => runValidationTasks("fileSize", fileSize)}
        errorMessage={errors.fileSize?.errorMessage}
        hasError={errors.fileSize?.hasError}
        {...getOverrideProps(overrides, "fileSize")}
      ></TextField>
      <TextField
        label="S3 key"
        isRequired={true}
        isReadOnly={false}
        value={s3Key}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key: value,
              status,
              approvalStatus,
              uploadDate,
              processedDate,
              approvedDate,
              rejectedDate,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.s3Key ?? value;
          }
          if (errors.s3Key?.hasError) {
            runValidationTasks("s3Key", value);
          }
          setS3Key(value);
        }}
        onBlur={() => runValidationTasks("s3Key", s3Key)}
        errorMessage={errors.s3Key?.errorMessage}
        hasError={errors.s3Key?.hasError}
        {...getOverrideProps(overrides, "s3Key")}
      ></TextField>
      <SelectField
        label="Status"
        placeholder="Please select an option"
        isDisabled={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key,
              status: value,
              approvalStatus,
              uploadDate,
              processedDate,
              approvedDate,
              rejectedDate,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.status ?? value;
          }
          if (errors.status?.hasError) {
            runValidationTasks("status", value);
          }
          setStatus(value);
        }}
        onBlur={() => runValidationTasks("status", status)}
        errorMessage={errors.status?.errorMessage}
        hasError={errors.status?.hasError}
        {...getOverrideProps(overrides, "status")}
      >
        <option
          children="Uploaded"
          value="UPLOADED"
          {...getOverrideProps(overrides, "statusoption0")}
        ></option>
        <option
          children="Processing"
          value="PROCESSING"
          {...getOverrideProps(overrides, "statusoption1")}
        ></option>
        <option
          children="Processed"
          value="PROCESSED"
          {...getOverrideProps(overrides, "statusoption2")}
        ></option>
        <option
          children="Failed"
          value="FAILED"
          {...getOverrideProps(overrides, "statusoption3")}
        ></option>
      </SelectField>
      <SelectField
        label="Approval status"
        placeholder="Please select an option"
        isDisabled={false}
        value={approvalStatus}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key,
              status,
              approvalStatus: value,
              uploadDate,
              processedDate,
              approvedDate,
              rejectedDate,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.approvalStatus ?? value;
          }
          if (errors.approvalStatus?.hasError) {
            runValidationTasks("approvalStatus", value);
          }
          setApprovalStatus(value);
        }}
        onBlur={() => runValidationTasks("approvalStatus", approvalStatus)}
        errorMessage={errors.approvalStatus?.errorMessage}
        hasError={errors.approvalStatus?.hasError}
        {...getOverrideProps(overrides, "approvalStatus")}
      >
        <option
          children="Pending"
          value="PENDING"
          {...getOverrideProps(overrides, "approvalStatusoption0")}
        ></option>
        <option
          children="Approved"
          value="APPROVED"
          {...getOverrideProps(overrides, "approvalStatusoption1")}
        ></option>
        <option
          children="Rejected"
          value="REJECTED"
          {...getOverrideProps(overrides, "approvalStatusoption2")}
        ></option>
      </SelectField>
      <TextField
        label="Upload date"
        isRequired={true}
        isReadOnly={false}
        type="datetime-local"
        value={uploadDate && convertToLocal(new Date(uploadDate))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key,
              status,
              approvalStatus,
              uploadDate: value,
              processedDate,
              approvedDate,
              rejectedDate,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.uploadDate ?? value;
          }
          if (errors.uploadDate?.hasError) {
            runValidationTasks("uploadDate", value);
          }
          setUploadDate(value);
        }}
        onBlur={() => runValidationTasks("uploadDate", uploadDate)}
        errorMessage={errors.uploadDate?.errorMessage}
        hasError={errors.uploadDate?.hasError}
        {...getOverrideProps(overrides, "uploadDate")}
      ></TextField>
      <TextField
        label="Processed date"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={processedDate && convertToLocal(new Date(processedDate))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key,
              status,
              approvalStatus,
              uploadDate,
              processedDate: value,
              approvedDate,
              rejectedDate,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.processedDate ?? value;
          }
          if (errors.processedDate?.hasError) {
            runValidationTasks("processedDate", value);
          }
          setProcessedDate(value);
        }}
        onBlur={() => runValidationTasks("processedDate", processedDate)}
        errorMessage={errors.processedDate?.errorMessage}
        hasError={errors.processedDate?.hasError}
        {...getOverrideProps(overrides, "processedDate")}
      ></TextField>
      <TextField
        label="Approved date"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={approvedDate && convertToLocal(new Date(approvedDate))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key,
              status,
              approvalStatus,
              uploadDate,
              processedDate,
              approvedDate: value,
              rejectedDate,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.approvedDate ?? value;
          }
          if (errors.approvedDate?.hasError) {
            runValidationTasks("approvedDate", value);
          }
          setApprovedDate(value);
        }}
        onBlur={() => runValidationTasks("approvedDate", approvedDate)}
        errorMessage={errors.approvedDate?.errorMessage}
        hasError={errors.approvedDate?.hasError}
        {...getOverrideProps(overrides, "approvedDate")}
      ></TextField>
      <TextField
        label="Rejected date"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={rejectedDate && convertToLocal(new Date(rejectedDate))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key,
              status,
              approvalStatus,
              uploadDate,
              processedDate,
              approvedDate,
              rejectedDate: value,
              rejectionReason,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.rejectedDate ?? value;
          }
          if (errors.rejectedDate?.hasError) {
            runValidationTasks("rejectedDate", value);
          }
          setRejectedDate(value);
        }}
        onBlur={() => runValidationTasks("rejectedDate", rejectedDate)}
        errorMessage={errors.rejectedDate?.errorMessage}
        hasError={errors.rejectedDate?.hasError}
        {...getOverrideProps(overrides, "rejectedDate")}
      ></TextField>
      <TextField
        label="Rejection reason"
        isRequired={false}
        isReadOnly={false}
        value={rejectionReason}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key,
              status,
              approvalStatus,
              uploadDate,
              processedDate,
              approvedDate,
              rejectedDate,
              rejectionReason: value,
              createdBy,
            };
            const result = onChange(modelFields);
            value = result?.rejectionReason ?? value;
          }
          if (errors.rejectionReason?.hasError) {
            runValidationTasks("rejectionReason", value);
          }
          setRejectionReason(value);
        }}
        onBlur={() => runValidationTasks("rejectionReason", rejectionReason)}
        errorMessage={errors.rejectionReason?.errorMessage}
        hasError={errors.rejectionReason?.hasError}
        {...getOverrideProps(overrides, "rejectionReason")}
      ></TextField>
      <TextField
        label="Created by"
        isRequired={true}
        isReadOnly={false}
        value={createdBy}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              fileName,
              fileSize,
              s3Key,
              status,
              approvalStatus,
              uploadDate,
              processedDate,
              approvedDate,
              rejectedDate,
              rejectionReason,
              createdBy: value,
            };
            const result = onChange(modelFields);
            value = result?.createdBy ?? value;
          }
          if (errors.createdBy?.hasError) {
            runValidationTasks("createdBy", value);
          }
          setCreatedBy(value);
        }}
        onBlur={() => runValidationTasks("createdBy", createdBy)}
        errorMessage={errors.createdBy?.errorMessage}
        hasError={errors.createdBy?.hasError}
        {...getOverrideProps(overrides, "createdBy")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || fileMetadataModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || fileMetadataModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
