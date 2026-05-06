import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'amplify/backend/function/billingvalidator'))

from datetime import datetime
import pandas as pd
from index import (
    calculate_tax_split,
    get_gl_code,
    eom_date,
    get_client_name,
    determine_dimension_type
)

# --- calculate_tax_split ---
def test_tax_split_with_tax():
    net_0, net_20, tax = calculate_tax_split(120, 20)
    assert tax == 20
    assert round(net_0 + net_20 + tax, 2) == 120

def test_tax_split_no_tax():
    net_0, net_20, tax = calculate_tax_split(100, 0)
    assert tax == 0
    assert net_20 == 0

# --- get_gl_code ---
def test_gl_code_education():
    assert get_gl_code("Education") == 4000

def test_gl_code_care():
    assert get_gl_code("Care") == 4001

def test_gl_code_unknown():
    assert get_gl_code("Something Else") == 4000

# --- eom_date ---
def test_eom_date_january():
    result = eom_date(datetime(2024, 1, 15))
    assert result.day == 31
    assert result.month == 1

def test_eom_date_none():
    result = eom_date(None)
    assert result is None

# --- get_client_name ---
def test_get_client_name_found():
    dimensions_df = pd.DataFrame([["CLASS001", "Test Client"]])
    result = get_client_name("CLASS001", dimensions_df)
    assert result == "Test Client"

def test_get_client_name_not_found():
    dimensions_df = pd.DataFrame([["CLASS001", "Test Client"]])
    result = get_client_name("MISSING", dimensions_df)
    assert result == "Unknown_Client"

# --- determine_dimension_type ---
def test_dimension_type_education():
    units_df = pd.DataFrame([["751/001", "Education Unit"]])
    result = determine_dimension_type("751/001", units_df)
    assert result == "Education"

def test_dimension_type_default():
    units_df = pd.DataFrame([["999/001", "Other Unit"]])
    result = determine_dimension_type("999/001", units_df)
    assert result == "Education"