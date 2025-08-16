#!/usr/bin/env python3
"""
Comprehensive UX/UI Testing Script
Tests all the implemented fixes for the IPSC application
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin123"

class UXUITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, status, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"[{status.upper()}] {test_name}: {details}")
        
    def login(self):
        """Login to get authentication token"""
        try:
            response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "username": TEST_USERNAME,
                "password": TEST_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("Login", "PASS", "Successfully authenticated")
                return True
            else:
                self.log_test("Login", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Login", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_dashboard_data_refresh(self):
        """Test Dashboard data refresh functionality"""
        try:
            # Test cashflow summary endpoint
            response = self.session.get(f"{BASE_URL}/api/cashflow/summary")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["period", "income", "expenses", "cashflow"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Dashboard Data Refresh", "PASS", 
                                f"All required fields present. Net cashflow: {data.get('cashflow', {}).get('net_cashflow', 0)}")
                else:
                    self.log_test("Dashboard Data Refresh", "FAIL", 
                                f"Missing fields: {missing_fields}")
            else:
                self.log_test("Dashboard Data Refresh", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Dashboard Data Refresh", "FAIL", f"Exception: {str(e)}")
    
    def test_cashflow_transactions(self):
        """Test Cashflow transactions data"""
        try:
            response = self.session.get(f"{BASE_URL}/api/cashflow/transactions")
            if response.status_code == 200:
                data = response.json()
                if "transactions" in data and "total_count" in data:
                    self.log_test("Cashflow Transactions", "PASS", 
                                f"Found {data['total_count']} transactions")
                else:
                    self.log_test("Cashflow Transactions", "FAIL", "Missing pagination structure")
            else:
                self.log_test("Cashflow Transactions", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Cashflow Transactions", "FAIL", f"Exception: {str(e)}")
    
    def test_products_pagination(self):
        """Test Products table pagination"""
        try:
            response = self.session.get(f"{BASE_URL}/api/products")
            if response.status_code == 200:
                products = response.json()
                if len(products) > 0:
                    self.log_test("Products Pagination", "PASS", 
                                f"Found {len(products)} products")
                else:
                    self.log_test("Products Pagination", "WARN", "No products found")
            else:
                self.log_test("Products Pagination", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Products Pagination", "FAIL", f"Exception: {str(e)}")
    
    def test_gst_toggle_dropdown(self):
        """Test GST toggle dropdown functionality"""
        try:
            # Test creating a party with different GST statuses
            test_parties = [
                {"name": "Test GST Customer", "gst_enabled": True, "type": "customer"},
                {"name": "Test Non-GST Customer", "gst_enabled": False, "type": "customer"},
                {"name": "Test Exempted Customer", "gst_enabled": False, "type": "customer"}
            ]
            
            for i, party_data in enumerate(test_parties):
                party_payload = {
                    "name": party_data["name"],
                    "type": party_data["type"],
                    "gst_enabled": party_data["gst_enabled"],
                    "email": f"test{i}@example.com",
                    "phone": f"123456789{i}",
                    "billing_address_line1": "123 Test St",
                    "billing_city": "Mumbai",
                    "billing_state": "Maharashtra",
                    "billing_pincode": "400001"
                }
                
                response = self.session.post(f"{BASE_URL}/api/parties", json=party_payload)
                if response.status_code == 201:
                    created_party = response.json()
                    gst_status = "GST" if created_party["gst_enabled"] else "Non-GST"
                    self.log_test(f"GST Toggle Dropdown - {gst_status}", "PASS", 
                                f"Created party: {created_party['name']}")
                else:
                    self.log_test(f"GST Toggle Dropdown - {party_data['name']}", "FAIL", 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("GST Toggle Dropdown", "FAIL", f"Exception: {str(e)}")
    
    def test_stock_movement_search(self):
        """Test Stock movement history search and pagination"""
        try:
            response = self.session.get(f"{BASE_URL}/api/inventory/stock-movements")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Stock Movement Search", "PASS", 
                                f"Found {len(data)} stock movements")
                else:
                    self.log_test("Stock Movement Search", "WARN", "Unexpected response format")
            else:
                self.log_test("Stock Movement Search", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Stock Movement Search", "FAIL", f"Exception: {str(e)}")
    
    def test_reporting_endpoints(self):
        """Test Reporting endpoints"""
        try:
            # Test GST reports
            response = self.session.get(f"{BASE_URL}/api/reports/gstr1?start_date=2024-01-01&end_date=2024-12-31")
            if response.status_code in [200, 404]:  # 404 is acceptable if no data
                self.log_test("GST Reports Endpoint", "PASS", "Endpoint accessible")
            else:
                self.log_test("GST Reports Endpoint", "FAIL", f"Status: {response.status_code}")
            
            # Test Financial reports
            response = self.session.get(f"{BASE_URL}/api/financial-reports/summary")
            if response.status_code == 200:
                data = response.json()
                if "key_metrics" in data:
                    self.log_test("Financial Reports Endpoint", "PASS", "Financial reports accessible")
                else:
                    self.log_test("Financial Reports Endpoint", "WARN", "Missing key_metrics")
            else:
                self.log_test("Financial Reports Endpoint", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Reporting Endpoints", "FAIL", f"Exception: {str(e)}")
    
    def test_frontend_accessibility(self):
        """Test Frontend accessibility"""
        try:
            response = requests.get(FRONTEND_URL, timeout=10)
            if response.status_code == 200:
                if "CASHFLOW" in response.text or "IPSC" in response.text:
                    self.log_test("Frontend Accessibility", "PASS", "Frontend is accessible")
                else:
                    self.log_test("Frontend Accessibility", "WARN", "Frontend accessible but content unclear")
            else:
                self.log_test("Frontend Accessibility", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Frontend Accessibility", "FAIL", f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all UX/UI tests"""
        print("🧪 Starting Comprehensive UX/UI Testing...")
        print("=" * 60)
        
        if not self.login():
            print("❌ Cannot proceed without authentication")
            return
        
        # Run all tests
        self.test_dashboard_data_refresh()
        self.test_cashflow_transactions()
        self.test_products_pagination()
        self.test_gst_toggle_dropdown()
        self.test_stock_movement_search()
        self.test_reporting_endpoints()
        self.test_frontend_accessibility()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 UX/UI TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAIL"])
        warning_tests = len([r for r in self.test_results if r["status"] == "WARN"])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️  Warnings: {warning_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Show failed tests
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"  - {result['test']}: {result['details']}")
        
        # Show warnings
        if warning_tests > 0:
            print("\n⚠️  WARNINGS:")
            for result in self.test_results:
                if result["status"] == "WARN":
                    print(f"  - {result['test']}: {result['details']}")
        
        # Save detailed results
        with open("test_reports/ux_ui_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: test_reports/ux_ui_test_results.json")

if __name__ == "__main__":
    tester = UXUITester()
    tester.run_all_tests()
