import sys
import os
from unittest.mock import MagicMock

# Mock AWS services before importing index
sys.modules['boto3'] = MagicMock()
sys.modules['botocore'] = MagicMock()
sys.modules['botocore.exceptions'] = MagicMock()

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