import json
import boto3
import boto3.dynamodb.conditions  # ADDED
from botocore.exceptions import ClientError  # ADDED
import pandas as pd
import numpy as np
from io import StringIO, BytesIO
from datetime import datetime, timedelta
import urllib.parse
import os
import traceback

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

CONFIG_BUCKET = "billing-config-amh"
OUTPUT_BUCKET = "billing-output-amh"

def eom_date(date_obj):
    if pd.isna(date_obj):
        return None
    next_month = date_obj.replace(day=28) + timedelta(days=4)
    return next_month - timedelta(days=next_month.day)

def calculate_tax_split(gross_amount, tax_amount):
    net_20 = tax_amount * 5 if tax_amount > 0 else 0
    net_0 = gross_amount - tax_amount - net_20
    if abs(net_0) < 0.20:
        net_20 += net_0
        net_0 = 0
    return net_0, net_20, tax_amount

def get_gl_code(dimension_type):
    gl_codes = {
        "Education": 4000,
        "Care": 4001,
        "Leisure": 4002,
        "Contractor": 4003
    }
    return gl_codes.get(dimension_type, 4000)

def calculate_due_date(posting_date, terms):
    if terms.lower() == "eom":
        return eom_date(posting_date)
    elif isinstance(terms, int):
        return posting_date + timedelta(days=terms)
    else:
        return posting_date + timedelta(days=30)

def get_client_name(class_id, dimensions_df):
    client_row = dimensions_df[dimensions_df.iloc[:, 0] == class_id]
    if not client_row.empty:
        return client_row.iloc[0, 1]
    return "Unknown_Client"

def load_from_s3(bucket, key, sheet_name=None):
    response = s3.get_object(Bucket=bucket, Key=key)
    file_content = response['Body'].read()
    if key.endswith('.xlsx'):
        if sheet_name:
            return pd.read_excel(BytesIO(file_content), sheet_name=sheet_name, engine="openpyxl")
        else:
            return pd.read_excel(BytesIO(file_content), engine="openpyxl")
    else:
        return pd.read_csv(BytesIO(file_content))

def upload_to_s3(df, bucket, key, file_type='excel'):
    if file_type == 'excel':
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        buffer.seek(0)
        s3.put_object(Bucket=bucket, Key=key, Body=buffer.getvalue())
    else:
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        s3.put_object(Bucket=bucket, Key=key, Body=csv_buffer.getvalue())

def update_file_metadata(file_id, updates):
    try:
        table_name = os.environ.get('FILE_METADATA_TABLE')
        if not table_name:
            print("❌ FILE_METADATA_TABLE environment variable not set")
            return None
        
        print(f"📝 Updating DynamoDB for file {file_id} with: {updates}")
        table = dynamodb.Table(table_name)
        
        update_expression = "SET "
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        for key, value in updates.items():
            update_expression += f"#{key} = :{key}, "
            expression_attribute_names[f"#{key}"] = key
            expression_attribute_values[f":{key}"] = value
        
        update_expression = update_expression[:-2]
        
        update_expression += ", #updatedAt = :updatedAt"
        expression_attribute_names["#updatedAt"] = "updatedAt"
        expression_attribute_values[":updatedAt"] = datetime.now().isoformat()
        
        response = table.update_item(
            Key={'id': file_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="UPDATED_NEW"
        )
        
        print(f"✅ Successfully updated file metadata for {file_id}")
        return response
        
    except Exception as e:
        print(f"❌ Error updating DynamoDB: {str(e)}")
        print(f"Stack trace: {traceback.format_exc()}")
        return None

def get_file_id_from_s3_metadata(bucket, key):
    try:
        response = s3.head_object(Bucket=bucket, Key=key)
        metadata = response.get('Metadata', {})
        file_id = metadata.get('fileid') or metadata.get('fileId')
        if file_id:
            print(f"🔍 Found file ID from S3 metadata: {file_id}")
            return file_id
        print("❌ No file ID found in S3 metadata")
        return None
    except Exception as e:
        print(f"❌ Error reading S3 metadata: {str(e)}")
        return None

def find_file_id_by_s3_key(s3_key):
    try:
        table_name = os.environ.get('FILE_METADATA_TABLE')
        if not table_name:
            print("❌ FILE_METADATA_TABLE environment variable not set")
            return None
            
        print(f"🔍 Searching DynamoDB for S3 key: {s3_key}")
        table = dynamodb.Table(table_name)
        
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('s3Key').eq(s3_key)
        )
        
        if response['Items'] and len(response['Items']) > 0:
            file_id = response['Items'][0]['id']
            print(f"✅ Found file by exact s3Key match: {file_id}")
            return file_id
        
        print("❌ No exact s3Key match found, trying filename match...")
        filename = s3_key.split('/')[-1]
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('fileName').eq(filename)
        )
        
        if response['Items'] and len(response['Items']) > 0:
            file_id = response['Items'][0]['id']
            print(f"✅ Found file by filename match: {file_id}")
            return file_id
            
        print(f"❌ No file found for S3 key: {s3_key}")
        print("📊 Available files in DynamoDB:")
        all_files = table.scan()
        for item in all_files['Items']:
            print(f"   - {item.get('fileName', 'N/A')} -> s3Key: {item.get('s3Key', 'N/A')}")
        return None
        
    except Exception as e:
        print(f"❌ Error finding file ID: {str(e)}")
        return None

def validate_units(report_df, units_df):
    report_df["Unit Code"] = report_df.iloc[:, 6].str.split().str[0]
    billable_codes = set(units_df.iloc[:, 0].astype(str))
    report_df = report_df[report_df["Unit Code"].isin(billable_codes)]
    missing_units = set(report_df["Unit Code"]) - billable_codes
    if missing_units:
        raise ValueError(f"Missing units: {missing_units}")
    return report_df

def create_data_sheet(report_df, units_df, dimensions_df):
    data_df = pd.DataFrame({
        "Unit Code": report_df["Unit Code"],
        "Class ID": report_df.iloc[:, 0],
        "Customer ID": report_df.iloc[:, 1],
        "Supplier ID": report_df.iloc[:, 2],
        "Supplier Name": report_df.iloc[:, 3],
        "AP Purchase Invoice Number": report_df.iloc[:, 4],
        "Date": pd.to_datetime(report_df.iloc[:, 5], format='%d/%m/%Y', errors="coerce"),
        "Description": report_df.iloc[:, 6],
        "Mark Up": report_df.iloc[:, 7],
        "Mark Up Check": report_df["Unit Code"] + "-" + report_df.iloc[:, 2].astype(str),
        "Transaction Amount": report_df.iloc[:, 8],
        "Transaction Tax": report_df.iloc[:, 9],
        "Total Amount": report_df.iloc[:, 10],
        "Period Code": report_df.iloc[:, 11]
    })
    data_df = data_df.fillna("Unknown")
    data_df = add_dimension_columns(data_df, units_df, dimensions_df)
    data_df.sort_values(by=["Supplier ID", "Class ID"], ascending=False, inplace=True)
    return data_df

def add_dimension_columns(data_df, units_df, dimensions_df):
    units_lookup = units_df.iloc[:, [0, 13, 18]]
    units_lookup.columns = ["Unit Code", "Invoice_Grouping_Type", "Email_Grouping_Type"]
    data_df = data_df.merge(units_lookup, on="Unit Code", how="left")
    for index, row in data_df.iterrows():
        grouping_type = row["Invoice_Grouping_Type"]
        class_id = row["Class ID"]
        dim_row = dimensions_df[dimensions_df.iloc[:, 0] == class_id]
        if not dim_row.empty:
            if grouping_type == "Centre":
                data_df.at[index, "Invoice Grouping Code"] = dim_row.iloc[0, 0]
                data_df.at[index, "Invoice Grouping Name"] = dim_row.iloc[0, 1]
            elif grouping_type == "Site":
                data_df.at[index, "Invoice Grouping Code"] = dim_row.iloc[0, 4]
                data_df.at[index, "Invoice Grouping Name"] = dim_row.iloc[0, 5]
            elif grouping_type == "Group":
                data_df.at[index, "Invoice Grouping Code"] = dim_row.iloc[0, 6]
                data_df.at[index, "Invoice Grouping Name"] = dim_row.iloc[0, 7]
            elif grouping_type == "Custom":
                data_df.at[index, "Invoice Grouping Code"] = dim_row.iloc[0, 16]
                data_df.at[index, "Invoice Grouping Name"] = dim_row.iloc[0, 17]
        email_type = row["Email_Grouping_Type"]
        if not dim_row.empty:
            if email_type == "Centre":
                data_df.at[index, "Email Code"] = dim_row.iloc[0, 0]
                data_df.at[index, "Email Name"] = dim_row.iloc[0, 1]
            elif email_type == "Site":
                data_df.at[index, "Email Code"] = dim_row.iloc[0, 4]
                data_df.at[index, "Email Name"] = dim_row.iloc[0, 5]
            elif email_type == "Group":
                data_df.at[index, "Email Code"] = dim_row.iloc[0, 6]
                data_df.at[index, "Email Name"] = dim_row.iloc[0, 7]
    return data_df

def generate_summary_sheets(data_df, units_df, mark_up_adjustments_df):
    summaries = {}
    for class_id, class_group in data_df.groupby("Class ID"):
        summary_data = []
        unit_code = class_group["Unit Code"].iloc[0]
        unit_row = units_df[units_df.iloc[:, 0] == unit_code]
        summary_format = unit_row.iloc[0, 17] if not unit_row.empty else "Standard"
        for supplier_id, supplier_group in class_group.groupby("Supplier ID"):
            supplier_total_net, supplier_total_tax, supplier_total_gross = 0, 0, 0
            for _, row in supplier_group.iterrows():
                markup = get_markup_rate(row, mark_up_adjustments_df)
                net, tax, gross = row["Transaction Amount"], row["Transaction Tax"], row["Total Amount"]
                markup_gross = gross * markup if markup else 0
                total_gross = gross + markup_gross
                summary_data.append({
                    "Supplier": row["Supplier Name"],
                    "Invoice Number": row["AP Purchase Invoice Number"],
                    "Date": row["Date"],
                    "Center": row["Invoice Grouping Name"],
                    "Net (£)": net,
                    "VAT (£)": tax,
                    "Gross (£)": gross,
                    "Mark Up": markup_gross,
                    "Invoice Total": total_gross
                })
                supplier_total_net += net
                supplier_total_tax += tax
                supplier_total_gross += total_gross
            summary_data.append({
                "Supplier": f"{row['Supplier Name']} Subtotal",
                "Net (£)": supplier_total_net,
                "VAT (£)": supplier_total_tax,
                "Gross (£)": supplier_total_gross
            })
        summary_df = pd.DataFrame(summary_data)
        grand_total_net = summary_df["Net (£)"].sum()
        grand_total_tax = summary_df["VAT (£)"].sum()
        grand_total_gross = summary_df["Gross (£)"].sum()
        grand_total_df = pd.DataFrame([{"Supplier": "GRAND TOTAL", "Net (£)": grand_total_net, "VAT (£)": grand_total_tax, "Gross (£)": grand_total_gross}])
        summary_df = pd.concat([grand_total_df, summary_df], ignore_index=True)
        summaries[class_id] = summary_df
    return summaries

def get_markup_rate(row, mark_up_adjustments_df):
    mark_up_check = row["Mark Up Check"]
    adjustment_row = mark_up_adjustments_df[mark_up_adjustments_df.iloc[:, 0] == mark_up_check]
    if not adjustment_row.empty:
        return adjustment_row.iloc[0, 1]
    return row["Mark Up"] if pd.notna(row["Mark Up"]) else 0

def create_invoice_template(data_df, units_df, mark_up_adjustments_df):
    invoice_lines = []
    for grouping_id, group in data_df.groupby("Invoice Grouping Code"):
        base_total_gross = group["Total Amount"].sum()
        base_total_tax = group["Transaction Tax"].sum()
        total_markup = 0
        for _, row in group.iterrows():
            markup_rate = get_markup_rate(row, mark_up_adjustments_df)
            total_markup += row["Total Amount"] * markup_rate if markup_rate else 0
        total_gross = base_total_gross + total_markup
        total_tax = base_total_tax
        doc_type = "Invoice" if total_gross >= 0 else "Credit"
        posting_date = eom_date(group["Date"].min())
        created_date = posting_date
        due_date = calculate_due_date(posting_date, "EOM")
        dimension_type = determine_dimension_type(group["Unit Code"].iloc[0], units_df)
        gl_code = get_gl_code(dimension_type)
        net_0, net_20, tax_20 = calculate_tax_split(total_gross, total_tax)
        if net_0 != 0:
            invoice_lines.append({
                "DONOTIMPORT": grouping_id,
                "INVOICE_NO": f"INV-{grouping_id}",
                "CUSTOMER_ID": group["Customer ID"].iloc[0],
                "posting_date": posting_date,
                "CREATED_DATE": created_date,
                "due_date": due_date,
                "TOTAL_DUE": total_gross,
                "Description": f"{doc_type} for {grouping_id} (Markup: £{total_markup:.2f})",
                "LINE_NO": 1,
                "MEMO": "Net at 0% Tax",
                "ACCT_NO": gl_code,
                "LOCATION_ID": "AMH",
                "AMOUNT": net_0,
                "SUPDOCID": "",
                "TAX_LINE_NO": 1,
                "TAX_AMOUNT": 0,
                "TAX_DETAILID": "UK Sale Goods Zero Rate"
            })
        elif net_20 != 0:
            invoice_lines.append({
                "DONOTIMPORT": grouping_id,
                "INVOICE_NO": f"INV-{grouping_id}",
                "CUSTOMER_ID": group["Customer ID"].iloc[0],
                "posting_date": posting_date,
                "CREATED_DATE": created_date,
                "due_date": due_date,
                "TOTAL_DUE": total_gross,
                "Description": f"{doc_type} for {grouping_id} (Markup: £{total_markup:.2f})",
                "LINE_NO": 1,
                "MEMO": "Net at 20% Tax",
                "ACCT_NO": gl_code,
                "LOCATION_ID": "AMH",
                "AMOUNT": net_20,
                "SUPDOCID": "",
                "TAX_LINE_NO": 1,
                "TAX_AMOUNT": tax_20,
                "TAX_DETAILID": "UK Sale Goods Standard Rate"
            })
        if net_0 != 0 and net_20 != 0:
            invoice_lines.append({
                "DONOTIMPORT": "",
                "INVOICE_NO": "",
                "CUSTOMER_ID": "",
                "posting_date": "",
                "CREATED_DATE": "",
                "due_date": "",
                "TOTAL_DUE": "",
                "Description": "",
                "LINE_NO": 1,
                "MEMO": "Net at 20% Tax",
                "ACCT_NO": gl_code,
                "LOCATION_ID": "AMH",
                "AMOUNT": net_20,
                "SUPDOCID": "",
                "TAX_LINE_NO": 1,
                "TAX_AMOUNT": tax_20,
                "TAX_DETAILID": "UK Sale Goods Standard Rate"
            })
    return pd.DataFrame(invoice_lines)

def determine_dimension_type(unit_code, units_df):
    unit_row = units_df[units_df.iloc[:, 0] == unit_code]
    if not unit_row.empty:
        unit_name = unit_row.iloc[0, 1]
        if "751" in unit_code or "Education" in unit_name:
            return "Education"
        elif "758" in unit_code or "Care" in unit_name:
            return "Care"
        elif "Leisure" in unit_name:
            return "Leisure"
        elif "Contractor" in unit_name:
            return "Contractor"
    return "Education"

def create_email_structure(data_df, summaries, output_bucket, dimensions_df):
    email_structure = []
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    for class_id, summary_df in summaries.items():
        unit_code = data_df[data_df["Class ID"] == class_id]["Unit Code"].iloc[0]
        period_code = data_df[data_df["Class ID"] == class_id]["Period Code"].iloc[0]
        client_name = get_client_name(class_id, dimensions_df)
        period_months = {
            "01": "August", "02": "September", "03": "October", "04": "November",
            "05": "December", "06": "January", "07": "February", "08": "March",
            "09": "April", "10": "May", "11": "June", "12": "July"
        }
        month_name = period_months.get(str(period_code).zfill(2), "Unknown")
        file_name = f"summaries/{class_id.replace('/', '-')}_INV_SUMM_{client_name}_{month_name}_{timestamp}.xlsx"
        upload_to_s3(summary_df, output_bucket, file_name)
        email_structure.append({
            "Unit Code": unit_code,
            "Document Grouping": class_id,
            "Email Code": data_df[data_df["Class ID"] == class_id]["Email Code"].iloc[0],
            "File Path": f"s3://{output_bucket}/{file_name}",
            "Doc.Type": "I-Summary",
            "Missing Details": ""
        })
    return pd.DataFrame(email_structure)

def lambda_handler(event, context):
    try:
        print("🚀 === LAMBDA START ===")
        
        bucket = None
        key = None
        
        if 'Records' in event and len(event['Records']) > 0:
            bucket = event['Records'][0]['s3']['bucket']['name']
            key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
            print(f"📂 S3 Trigger - Bucket: {bucket}, Key: {key}")
        elif 'bucket' in event and 'key' in event:
            bucket = event['bucket']
            key = event['key']
            print(f"📂 Manual Trigger - Bucket: {bucket}, Key: {key}")
        else:
            raise ValueError("❌ Could not determine bucket and key from event")
        
        print(f"🔍 Processing file: s3://{bucket}/{key}")

        file_id = None
        can_update_dynamodb = False
        
        print("🔍 Step 1: Trying to get file ID from S3 metadata...")
        file_id = get_file_id_from_s3_metadata(bucket, key)
        
        if not file_id:
            print("🔍 Step 2: Trying to find file ID by S3 key...")
            file_id = find_file_id_by_s3_key(key)
        
        if not file_id:
            print("❌ CRITICAL: Could not find file ID in DynamoDB")
            print("💡 This usually means:")
            print("   - FileUpload didn't save the s3Key properly to DynamoDB")
            print("   - The s3Key in DynamoDB doesn't match the actual S3 key")
            print("   - FILE_METADATA_TABLE environment variable is wrong")
            can_update_dynamodb = False
        else:
            can_update_dynamodb = True
            print(f"✅ Found file ID: {file_id}")

        if can_update_dynamodb:
            print("🔄 Updating status to PROCESSING...")
            update_result = update_file_metadata(file_id, {
                'status': 'PROCESSING',
                'processedDate': datetime.now().isoformat()
            })
            if not update_result:
                print("❌ Failed to update DynamoDB, continuing without updates")
                can_update_dynamodb = False

        print("📊 Loading and processing file...")
        if key.endswith('.xlsx'):
            report_df = load_from_s3(bucket, key)
        else:
            report_df = load_from_s3(bucket, key)

        print("📂 Loading configuration files...")
        units_df = load_from_s3(CONFIG_BUCKET, "Client Billing Matrix - Sage Version.xlsx", "Units")
        dimensions_df = load_from_s3(CONFIG_BUCKET, "Client Dimensions - Sage version.xlsx", "Dimensions")
        mark_up_adjustments_df = load_from_s3(CONFIG_BUCKET, "Client Billing Matrix - Sage Version.xlsx", "Mark Up Adjustments")

        print("⚙️ Processing billing data...")
        report_df = validate_units(report_df, units_df)
        data_df = create_data_sheet(report_df, units_df, dimensions_df)
        summaries = generate_summary_sheets(data_df, units_df, mark_up_adjustments_df)
        invoice_df = create_invoice_template(data_df, units_df, mark_up_adjustments_df)
        email_structure_df = create_email_structure(data_df, summaries, OUTPUT_BUCKET, dimensions_df)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        input_file_name = key.split('/')[-1].replace('.csv', '').replace('.xlsx', '').replace(' ', '_')

        output_files = []

        data_file_key = f"outputs/{input_file_name}_Data_{timestamp}.xlsx"
        upload_to_s3(data_df, OUTPUT_BUCKET, data_file_key)
        output_files.append({
            'type': 'DATA_SHEET',
            's3Key': data_file_key,
            'fileName': f"{input_file_name}_Data_{timestamp}.xlsx",
            'category': 'MAIN_OUTPUT'
        })

        invoice_file_key = f"outputs/{input_file_name}_Invoice_Template_{timestamp}.csv"
        upload_to_s3(invoice_df, OUTPUT_BUCKET, invoice_file_key, 'csv')
        output_files.append({
            'type': 'INVOICE_TEMPLATE',
            's3Key': invoice_file_key,
            'fileName': f"{input_file_name}_Invoice_Template_{timestamp}.csv",
            'category': 'MAIN_OUTPUT'
        })

        email_file_key = f"outputs/{input_file_name}_Email_Structure_{timestamp}.xlsx"
        upload_to_s3(email_structure_df, OUTPUT_BUCKET, email_file_key)
        output_files.append({
            'type': 'EMAIL_STRUCTURE',
            's3Key': email_file_key,
            'fileName': f"{input_file_name}_Email_Structure_{timestamp}.xlsx",
            'category': 'MAIN_OUTPUT'
        })

        for class_id, summary_df in summaries.items():
            safe_class_id = class_id.replace("/", "-")
            client_name = get_client_name(class_id, dimensions_df).replace(" ", "_").replace("/", "-")
            summary_file_key = f"summaries/{input_file_name}_Summary_{client_name}_{safe_class_id}_{timestamp}.xlsx"
            upload_to_s3(summary_df, OUTPUT_BUCKET, summary_file_key)
            output_files.append({
                'type': 'CLIENT_SUMMARY',
                's3Key': summary_file_key,
                'fileName': f"{input_file_name}_Summary_{client_name}_{safe_class_id}.xlsx",
                'category': 'SUMMARY',
                'clientName': client_name,
                'classId': class_id
            })

        print("✅ Billing processing completed successfully!")
        
        if can_update_dynamodb:
            print("💾 Updating DynamoDB with output files...")
            update_result = update_file_metadata(file_id, {
                'status': 'PROCESSED',
                'outputFiles': output_files,
                'processedDate': datetime.now().isoformat()
            })
            if update_result:
                print("🎉 SUCCESS: DynamoDB updated with output files!")
            else:
                print("❌ WARNING: Failed to update DynamoDB with output files")
        else:
            print("⚠️  SKIPPED: Could not update DynamoDB (no file ID found)")
        
        print("🏁 === LAMBDA COMPLETED ===")
        
        return {
            'status': 'SUCCESS',
            'inputFile': key,
            'outputFiles': output_files,
            'processedRecords': len(data_df),
            'summaryCount': len(summaries),
            'timestamp': timestamp,
            'dynamodbUpdated': can_update_dynamodb
        }

    except Exception as e:
        error_msg = f"❌ Error processing billing data: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        
        if 'file_id' in locals() and file_id and 'can_update_dynamodb' in locals() and can_update_dynamodb:
            print("🔄 Updating status to FAILED in DynamoDB...")
            update_file_metadata(file_id, {
                'status': 'FAILED',
                'errorMessage': str(e)
            })
        
        return {
            'status': 'FAILED',
            'error': str(e)
        }