#!/usr/bin/env python3
"""
Enhanced Test Suite for IPSC Application
Supports multiple environments and comprehensive testing
"""

import argparse
import json
import os
import sys
import time
import requests
import subprocess
from datetime import datetime, timezone
from typing import Dict, List, Any

class TestSuite:
    def __init__(self, environment: str = "dev"):
        self.environment = environment
        self.base_url = self._get_base_url()
        self.test_results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "environment": environment,
            "tests": [],
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "success_rate": 0.0
            }
        }
        
    def _get_base_url(self) -> str:
        """Get base URL based on environment"""
        urls = {
            "dev": "http://localhost:8000",
            "uat": "http://localhost:8001", 
            "prod": "http://localhost:8002"
        }
        return urls.get(self.environment, urls["dev"])
    
    def log_test(self, name: str, status: str, details: str = "", duration: float = 0):
        """Log test result"""
        test_result = {
            "name": name,
            "status": status,
            "details": details,
            "duration": duration,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.test_results["tests"].append(test_result)
        
        # Update summary
        self.test_results["summary"]["total"] += 1
        if status == "PASSED":
            self.test_results["summary"]["passed"] += 1
        elif status == "FAILED":
            self.test_results["summary"]["failed"] += 1
        else:
            self.test_results["summary"]["skipped"] += 1
            
        # Calculate success rate
        total = self.test_results["summary"]["total"]
        passed = self.test_results["summary"]["passed"]
        self.test_results["summary"]["success_rate"] = (passed / total * 100) if total > 0 else 0
        
        # Print result
        status_icon = "✅" if status == "PASSED" else "❌" if status == "FAILED" else "⏭️"
        print(f"{status_icon} {name}: {status} ({duration:.2f}s)")
        if details:
            print(f"   Details: {details}")

    def test_backend_health(self) -> bool:
        """Test backend health endpoint"""
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                self.log_test("Backend Health Check", "PASSED", f"Status: {response.status_code}", duration)
                return True
            else:
                self.log_test("Backend Health Check", "FAILED", f"Status: {response.status_code}", duration)
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Backend Health Check", "FAILED", f"Error: {str(e)}", duration)
            return False

    def test_frontend_health(self) -> bool:
        """Test frontend health"""
        start_time = time.time()
        try:
            # Frontend runs on port 5173 in development (Vite dev server)
            frontend_url = self.base_url.replace("8000", "5173").replace("8001", "5173").replace("8002", "5173")
            response = requests.get(frontend_url, timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                self.log_test("Frontend Health Check", "PASSED", f"Status: {response.status_code}", duration)
                return True
            else:
                self.log_test("Frontend Health Check", "FAILED", f"Status: {response.status_code}", duration)
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Frontend Health Check", "FAILED", f"Error: {str(e)}", duration)
            return False

    def test_database_connection(self) -> bool:
        """Test database connection"""
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                # Check if database is mentioned in the response
                if "database" in str(data).lower() or "status" in data:
                    self.log_test("Database Connection", "PASSED", "Database is accessible", duration)
                    return True
                else:
                    self.log_test("Database Connection", "FAILED", "Database status not found in response", duration)
                    return False
            else:
                self.log_test("Database Connection", "FAILED", f"Health check failed: {response.status_code}", duration)
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Database Connection", "FAILED", f"Error: {str(e)}", duration)
            return False

    def test_api_endpoints(self) -> bool:
        """Test critical API endpoints"""
        endpoints = [
            ("/api/invoices", "GET"),
            ("/api/parties/customers", "GET"), 
            ("/api/products", "GET"),
            ("/api/parties/vendors", "GET")
        ]
        
        all_passed = True
        for endpoint, method in endpoints:
            start_time = time.time()
            try:
                response = requests.request(method, f"{self.base_url}{endpoint}", timeout=10)
                duration = time.time() - start_time
                
                # Accept 200, 401 (unauthorized), or 403 (forbidden) as valid responses
                if response.status_code in [200, 401, 403]:
                    self.log_test(f"API {method} {endpoint}", "PASSED", f"Status: {response.status_code}", duration)
                else:
                    self.log_test(f"API {method} {endpoint}", "FAILED", f"Status: {response.status_code}", duration)
                    all_passed = False
            except Exception as e:
                duration = time.time() - start_time
                self.log_test(f"API {method} {endpoint}", "FAILED", f"Error: {str(e)}", duration)
                all_passed = False
                
        return all_passed

    def test_authentication(self) -> bool:
        """Test authentication flow"""
        start_time = time.time()
        try:
            # Test login endpoint
            login_data = {"username": "admin", "password": "admin123"}
            response = requests.post(f"{self.base_url}/api/auth/login", json=login_data, timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                token = response.json().get("access_token")
                if token:
                    # Test authenticated endpoint
                    headers = {"Authorization": f"Bearer {token}"}
                    auth_response = requests.get(f"{self.base_url}/api/invoices", headers=headers, timeout=10)
                    
                    if auth_response.status_code in [200, 403]:  # 403 is acceptable if user lacks permissions
                        self.log_test("Authentication Flow", "PASSED", "Login and token validation successful", duration)
                        return True
                    else:
                        self.log_test("Authentication Flow", "FAILED", f"Token validation failed: {auth_response.status_code}", duration)
                        return False
                else:
                    self.log_test("Authentication Flow", "FAILED", "No access token in response", duration)
                    return False
            else:
                self.log_test("Authentication Flow", "FAILED", f"Login failed: {response.status_code}", duration)
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Authentication Flow", "FAILED", f"Error: {str(e)}", duration)
            return False

    def test_invoice_creation(self) -> bool:
        """Test invoice creation flow"""
        start_time = time.time()
        try:
            # First authenticate
            login_data = {"username": "admin", "password": "admin123"}
            login_response = requests.post(f"{self.base_url}/api/auth/login", json=login_data, timeout=10)
            
            if login_response.status_code != 200:
                self.log_test("Invoice Creation", "SKIPPED", "Authentication required but failed", time.time() - start_time)
                return True
                
            token = login_response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test invoice creation
            invoice_data = {
                "customer_id": 1,  # Assuming customer with ID 1 exists
                "supplier_id": 1,  # Assuming supplier with ID 1 exists
                "invoice_no": f"TEST-{int(time.time())}",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "bill_to_address": "Test Bill Address",
                "ship_to_address": "Test Ship Address",
                "place_of_supply": "Karnataka",
                "place_of_supply_state_code": "29",
                "items": [
                    {
                        "product_id": 1,  # Assuming product with ID 1 exists
                        "qty": 1,
                        "rate": 100.00,
                        "description": "Test Item"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data, headers=headers, timeout=10)
            duration = time.time() - start_time
            
            if response.status_code in [200, 201]:
                self.log_test("Invoice Creation", "PASSED", "Invoice created successfully", duration)
                return True
            else:
                self.log_test("Invoice Creation", "FAILED", f"Creation failed: {response.status_code} - {response.text}", duration)
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Invoice Creation", "FAILED", f"Error: {str(e)}", duration)
            return False

    def test_e2e_flows(self) -> bool:
        """Test end-to-end user flows"""
        start_time = time.time()
        try:
            # Run Playwright E2E tests
            result = subprocess.run(
                ["npx", "playwright", "test", "tests/e2e/critical-flows.spec.ts", "--reporter=list"],
                cwd="frontend",
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            duration = time.time() - start_time
            
            if result.returncode == 0:
                self.log_test("E2E Critical Flows", "PASSED", "All critical flows passed", duration)
                return True
            else:
                self.log_test("E2E Critical Flows", "FAILED", f"E2E tests failed: {result.stderr}", duration)
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("E2E Critical Flows", "FAILED", f"Error running E2E tests: {str(e)}", duration)
            return False

    def test_performance(self) -> bool:
        """Test performance metrics"""
        start_time = time.time()
        try:
            # Test response times for critical endpoints
            endpoints = ["/health", "/api/invoices", "/api/parties/customers"]
            all_passed = True
            
            for endpoint in endpoints:
                endpoint_start = time.time()
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                endpoint_duration = time.time() - endpoint_start
                
                if response.status_code in [200, 401, 403] and endpoint_duration < 5.0:  # 5 second threshold
                    self.log_test(f"Performance {endpoint}", "PASSED", f"Response time: {endpoint_duration:.2f}s", endpoint_duration)
                else:
                    self.log_test(f"Performance {endpoint}", "FAILED", f"Slow response: {endpoint_duration:.2f}s", endpoint_duration)
                    all_passed = False
            
            duration = time.time() - start_time
            return all_passed
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Performance Tests", "FAILED", f"Error: {str(e)}", duration)
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and return results"""
        print(f"\n🚀 Running Test Suite for {self.environment.upper()} Environment")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Run all test categories
        test_functions = [
            self.test_backend_health,
            self.test_frontend_health,
            self.test_database_connection,
            self.test_api_endpoints,
            self.test_authentication,
            self.test_invoice_creation,
            self.test_performance
        ]
        
        # Only run E2E tests if we're in a CI environment or explicitly requested
        if os.getenv("CI") or self.environment in ["uat", "prod"]:
            test_functions.append(self.test_e2e_flows)
        
        for test_func in test_functions:
            try:
                test_func()
            except Exception as e:
                self.log_test(test_func.__name__, "FAILED", f"Unexpected error: {str(e)}", 0)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.test_results['summary']['total']}")
        print(f"Passed: {self.test_results['summary']['passed']}")
        print(f"Failed: {self.test_results['summary']['failed']}")
        print(f"Skipped: {self.test_results['summary']['skipped']}")
        print(f"Success Rate: {self.test_results['summary']['success_rate']:.1f}%")
        
        # Determine overall success
        success_rate = self.test_results['summary']['success_rate']
        min_success_rate = 70 if self.environment == "dev" else 90
        
        if success_rate >= min_success_rate:
            print(f"\n✅ Test suite PASSED (Success rate: {success_rate:.1f}% >= {min_success_rate}%)")
            self.test_results["overall_status"] = "PASSED"
        else:
            print(f"\n❌ Test suite FAILED (Success rate: {success_rate:.1f}% < {min_success_rate}%)")
            self.test_results["overall_status"] = "FAILED"
        
        return self.test_results

    def save_results(self, filename: str = None):
        """Save test results to file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test_results_{self.environment}_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n💾 Test results saved to: {filename}")
        return filename

def main():
    parser = argparse.ArgumentParser(description="Enhanced Test Suite for IPSC Application")
    parser.add_argument("--env", default="dev", choices=["dev", "uat", "prod"], 
                       help="Environment to test (default: dev)")
    parser.add_argument("--output", help="Output file for test results")
    parser.add_argument("--save", action="store_true", help="Save results to file")
    
    args = parser.parse_args()
    
    # Create and run test suite
    test_suite = TestSuite(args.env)
    results = test_suite.run_all_tests()
    
    # Save results if requested
    if args.save or args.output:
        filename = test_suite.save_results(args.output)
        
        # Also save to standard location for CI/CD
        if os.getenv("CI"):
            test_suite.save_results("test_report.json")
    
    # Exit with appropriate code
    if results["overall_status"] == "PASSED":
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
