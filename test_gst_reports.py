#!/usr/bin/env python3
"""
Test GST Reports Script

This script tests the GST report functionality using the seeded test data.
"""

import requests
import json
from datetime import date

# API base URL
BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get authentication token"""
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_gst_validation():
    """Test GST data validation"""
    print("🔍 Testing GST Data Validation...")
    
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test validation for January 2024
    response = requests.get(
        f"{BASE_URL}/api/reports/gst-validation",
        params={
            "start_date": "2024-01-01",
            "end_date": "2024-01-31"
        },
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ GST Validation Response:")
        print(f"   GSTR-1 Valid: {data['gstr1_valid']}")
        print(f"   GSTR-3B Valid: {data['gstr3b_valid']}")
        if data['gstr1_errors']:
            print(f"   GSTR-1 Errors: {data['gstr1_errors']}")
        if data['gstr3b_errors']:
            print(f"   GSTR-3B Errors: {data['gstr3b_errors']}")
    else:
        print(f"❌ GST Validation failed: {response.status_code}")
        print(response.text)

def test_gstr1_report():
    """Test GSTR-1 report generation"""
    print("\n📊 Testing GSTR-1 Report Generation...")
    
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test JSON format
    response = requests.get(
        f"{BASE_URL}/api/reports/gstr1",
        params={
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "format": "json"
        },
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ GSTR-1 Report (JSON):")
        print(f"   Success: {data['success']}")
        print(f"   Total Records: {data['total_records']}")
        print(f"   Period: {data['period']}")
        
        if data['success'] and data['data']:
            print(f"   Sample Record Fields: {list(data['data'][0].keys())}")
    else:
        print(f"❌ GSTR-1 Report failed: {response.status_code}")
        print(response.text)
    
    # Test CSV format
    response = requests.get(
        f"{BASE_URL}/api/reports/gstr1",
        params={
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "format": "csv"
        },
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ GSTR-1 Report (CSV):")
        print(f"   Content-Type: {response.headers.get('content-type')}")
        print(f"   Content-Disposition: {response.headers.get('content-disposition')}")
        print(f"   CSV Content Length: {len(response.text)} characters")
        print(f"   First 200 chars: {response.text[:200]}...")
    else:
        print(f"❌ GSTR-1 CSV Report failed: {response.status_code}")

def test_gstr3b_report():
    """Test GSTR-3B report generation"""
    print("\n📊 Testing GSTR-3B Report Generation...")
    
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test JSON format
    response = requests.get(
        f"{BASE_URL}/api/reports/gstr3b",
        params={
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "format": "json"
        },
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ GSTR-3B Report (JSON):")
        print(f"   Success: {data['success']}")
        print(f"   Period: {data['period']}")
        
        if data['success'] and 'data' in data:
            summary = data['data']['summary']
            print(f"   Total Taxable Value: ₹{summary['total_taxable_value']:,.2f}")
            print(f"   Total CGST: ₹{summary['total_cgst']:,.2f}")
            print(f"   Total SGST: ₹{summary['total_sgst']:,.2f}")
            print(f"   Total IGST: ₹{summary['total_igst']:,.2f}")
            print(f"   Net Tax Payable: ₹{summary['net_cgst'] + summary['net_sgst'] + summary['net_igst']:,.2f}")
    else:
        print(f"❌ GSTR-3B Report failed: {response.status_code}")
        print(response.text)
    
    # Test CSV format
    response = requests.get(
        f"{BASE_URL}/api/reports/gstr3b",
        params={
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "format": "csv"
        },
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ GSTR-3B Report (CSV):")
        print(f"   Content-Type: {response.headers.get('content-type')}")
        print(f"   Content-Disposition: {response.headers.get('content-disposition')}")
        print(f"   CSV Content Length: {len(response.text)} characters")
        print(f"   First 200 chars: {response.text[:200]}...")
    else:
        print(f"❌ GSTR-3B CSV Report failed: {response.status_code}")

def test_api_endpoints():
    """Test basic API endpoints"""
    print("\n🔧 Testing Basic API Endpoints...")
    
    # Test version endpoint
    response = requests.get(f"{BASE_URL}/version")
    if response.status_code == 200:
        print("✅ Version endpoint working")
    else:
        print(f"❌ Version endpoint failed: {response.status_code}")
    
    # Test parties endpoint
    token = get_auth_token()
    if token:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/parties", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Parties endpoint working - Found {len(data)} parties")
        else:
            print(f"❌ Parties endpoint failed: {response.status_code}")
    
    # Test invoices endpoint
    if token:
        response = requests.get(f"{BASE_URL}/api/invoices", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Invoices endpoint working - Found {len(data)} invoices")
        else:
            print(f"❌ Invoices endpoint failed: {response.status_code}")

def main():
    """Main test function"""
    print("🧪 GST Reports Testing Script")
    print("=" * 50)
    
    # Test basic endpoints first
    test_api_endpoints()
    
    # Test GST functionality
    test_gst_validation()
    test_gstr1_report()
    test_gstr3b_report()
    
    print("\n🎉 Testing completed!")

if __name__ == "__main__":
    main()
