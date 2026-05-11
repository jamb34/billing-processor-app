import pandas as pd
from datetime import datetime, timedelta

# Billing logic functions

def calculate_tax_split(gross_amount, tax_amount):
    net_20 = tax_amount * 5 if tax_amount > 0 else 0
    net_0 = gross_amount - tax_amount - net_20
    if abs(net_0) < 0.20:
        net_20 += net_0
        net_0 = 0
    return round(net_0, 2), round(net_20, 2), round(tax_amount, 2)

def get_gl_code(dimension_type):
    gl_codes = {
        "Education": 4000,
        "Care": 4001,
        "Leisure": 4002,
        "Contractor": 4003
    }
    return gl_codes.get(dimension_type, 4000)

def eom_date(date_obj):
    if date_obj is None:
        return None
    next_month = date_obj.replace(day=28) + timedelta(days=4)
    return next_month - timedelta(days=next_month.day)

def get_client_name(class_id, dimensions_df):
    client_row = dimensions_df[dimensions_df.iloc[:, 0] == class_id]
    if not client_row.empty:
        return client_row.iloc[0, 1]
    return "Unknown_Client"

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

# test

def test_tax_split_with_tax():
    net_0, net_20, tax = calculate_tax_split(120, 20)
    assert tax == 20
    assert round(net_0 + net_20 + tax, 2) == 120

def test_tax_split_no_tax():
    net_0, net_20, tax = calculate_tax_split(100, 0)
    assert tax == 0
    assert net_20 == 0

def test_gl_code_education():
    assert get_gl_code("Education") == 4000

def test_gl_code_care():
    assert get_gl_code("Care") == 4001

def test_gl_code_unknown():
    assert get_gl_code("Something Else") == 4000

def test_eom_date_january():
    result = eom_date(datetime(2024, 1, 15))
    assert result.day == 31
    assert result.month == 1

def test_eom_date_none():
    result = eom_date(None)
    assert result is None

def test_get_client_name_found():
    dimensions_df = pd.DataFrame([["CLASS001", "Test Client"]])
    result = get_client_name("CLASS001", dimensions_df)
    assert result == "Test Client"

def test_get_client_name_not_found():
    dimensions_df = pd.DataFrame([["CLASS001", "Test Client"]])
    result = get_client_name("MISSING", dimensions_df)
    assert result == "Unknown_Client"

def test_dimension_type_education():
    units_df = pd.DataFrame([["751/001", "Education Unit"]])
    result = determine_dimension_type("751/001", units_df)
    assert result == "Education"

def test_dimension_type_default():
    units_df = pd.DataFrame([["999/001", "Other Unit"]])
    result = determine_dimension_type("999/001", units_df)
    assert result == "Education"