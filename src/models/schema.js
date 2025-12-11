export const schema = {
    "models": {
        "FileMetadata": {
            "name": "FileMetadata",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "fileName": {
                    "name": "fileName",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "fileSize": {
                    "name": "fileSize",
                    "isArray": false,
                    "type": "Int",
                    "isRequired": false,
                    "attributes": []
                },
                "status": {
                    "name": "status",
                    "isArray": false,
                    "type": {
                        "enum": "FileStatus"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "approvalStatus": {
                    "name": "approvalStatus",
                    "isArray": false,
                    "type": {
                        "enum": "ApprovalStatus"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "uploadDate": {
                    "name": "uploadDate",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "processedDate": {
                    "name": "processedDate",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": []
                },
                "approvedDate": {
                    "name": "approvedDate",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": []
                },
                "rejectedDate": {
                    "name": "rejectedDate",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": []
                },
                "rejectionReason": {
                    "name": "rejectionReason",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "outputFiles": {
                    "name": "outputFiles",
                    "isArray": true,
                    "type": {
                        "nonModel": "OutputFile"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true
                },
                "createdBy": {
                    "name": "createdBy",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                }
            },
            "syncable": true,
            "pluralName": "FileMetadata",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "provider": "userPools",
                                "ownerField": "owner",
                                "allow": "owner",
                                "identityClaim": "cognito:username",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    },
    "enums": {
        "FileStatus": {
            "name": "FileStatus",
            "values": [
                "UPLOADED",
                "PROCESSING",
                "PROCESSED",
                "FAILED"
            ]
        },
        "ApprovalStatus": {
            "name": "ApprovalStatus",
            "values": [
                "PENDING",
                "APPROVED",
                "REJECTED"
            ]
        }
    },
    "nonModels": {
        "OutputFile": {
            "name": "OutputFile",
            "fields": {
                "type": {
                    "name": "type",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "s3Key": {
                    "name": "s3Key",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "fileName": {
                    "name": "fileName",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "generatedDate": {
                    "name": "generatedDate",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                }
            }
        }
    },
    "codegenVersion": "3.4.4",
    "version": "400a6546515cdfb8eebb71c757c1b347"
};