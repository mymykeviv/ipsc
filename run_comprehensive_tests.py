#!/usr/bin/env python3
"""
Comprehensive Test Runner for IPSC Application
Version: 1.37.0
"""

import os
import sys
import subprocess
import json
import datetime
from pathlib import Path

class ComprehensiveTestRunner:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.test_results = {}
        self.coverage_data = {}
        self.start_time = datetime.datetime.now()
        
    def setup_environment(self):
        """Setup test environment"""
        print("🔧 Setting up test environment...")
        
        # Set testing environment variable
        os.environ["TESTING"] = "1"
        
        # Create test directories if they don't exist
        test_dirs = ["test_reports", "coverage_reports", "quality_reports"]
        for dir_name in test_dirs:
            dir_path = self.project_root / dir_name
            dir_path.mkdir(exist_ok=True)
            
        print("✅ Test environment setup complete")
        
    def run_backend_tests(self):
        """Run backend tests with coverage"""
        print("\n🧪 Running Backend Tests...")
        
        try:
            # Run tests with coverage
            cmd = [
                "python", "-m", "pytest", 
                "tests/backend/",
                "-v",
                "--tb=short",
                "--cov=backend",
                "--cov-report=html:coverage_reports/backend",
                "--cov-report=json:coverage_reports/backend_coverage.json",
                "--cov-report=term-missing",
                "--junitxml=test_reports/backend_tests.xml"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_root)
            
            self.test_results["backend"] = {
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
            if result.returncode == 0:
                print("✅ Backend tests completed successfully")
            else:
                print("❌ Backend tests failed")
                print(result.stderr)
                
        except Exception as e:
            print(f"❌ Error running backend tests: {e}")
            self.test_results["backend"] = {
                "return_code": -1,
                "error": str(e),
                "success": False
            }
    
    def run_frontend_tests(self):
        """Run frontend tests"""
        print("\n🧪 Running Frontend Tests...")
        
        try:
            # Check if frontend tests exist
            frontend_test_dir = self.project_root / "frontend" / "src"
            test_files = list(frontend_test_dir.rglob("*.test.*")) + list(frontend_test_dir.rglob("*.spec.*"))
            
            if not test_files:
                print("⚠️  No frontend test files found")
                self.test_results["frontend"] = {
                    "return_code": 0,
                    "message": "No frontend tests found",
                    "success": True
                }
                return
            
            # Run frontend tests (assuming npm/yarn is available)
            cmd = ["npm", "test", "--", "--coverage", "--watchAll=false"]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_root / "frontend")
            
            self.test_results["frontend"] = {
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
            if result.returncode == 0:
                print("✅ Frontend tests completed successfully")
            else:
                print("❌ Frontend tests failed")
                print(result.stderr)
                
        except Exception as e:
            print(f"❌ Error running frontend tests: {e}")
            self.test_results["frontend"] = {
                "return_code": -1,
                "error": str(e),
                "success": False
            }
    
    def run_integration_tests(self):
        """Run integration tests"""
        print("\n🧪 Running Integration Tests...")
        
        try:
            # Run E2E tests
            cmd = [
                "python", "-m", "pytest", 
                "tests/e2e/",
                "-v",
                "--tb=short",
                "--junitxml=test_reports/integration_tests.xml"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_root)
            
            self.test_results["integration"] = {
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
            if result.returncode == 0:
                print("✅ Integration tests completed successfully")
            else:
                print("❌ Integration tests failed")
                print(result.stderr)
                
        except Exception as e:
            print(f"❌ Error running integration tests: {e}")
            self.test_results["integration"] = {
                "return_code": -1,
                "error": str(e),
                "success": False
            }
    
    def run_smoke_tests(self):
        """Run smoke tests for critical functionality"""
        print("\n🧪 Running Smoke Tests...")
        
        try:
            # Run critical functionality tests
            critical_tests = [
                "tests/backend/test_auth.py",
                "tests/backend/test_purchase_payments.py",
                "tests/backend/test_invoice_payments.py"
            ]
            
            cmd = [
                "python", "-m", "pytest", 
                *critical_tests,
                "-v",
                "--tb=short",
                "--junitxml=test_reports/smoke_tests.xml"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_root)
            
            self.test_results["smoke"] = {
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
            if result.returncode == 0:
                print("✅ Smoke tests completed successfully")
            else:
                print("❌ Smoke tests failed")
                print(result.stderr)
                
        except Exception as e:
            print(f"❌ Error running smoke tests: {e}")
            self.test_results["smoke"] = {
                "return_code": -1,
                "error": str(e),
                "success": False
            }
    
    def generate_coverage_report(self):
        """Generate comprehensive coverage report"""
        print("\n📊 Generating Coverage Report...")
        
        try:
            # Read coverage data if available
            coverage_file = self.project_root / "coverage_reports" / "backend_coverage.json"
            if coverage_file.exists():
                with open(coverage_file, 'r') as f:
                    self.coverage_data = json.load(f)
            
            # Calculate overall metrics
            total_tests = sum(1 for result in self.test_results.values() if result.get("success", False))
            total_test_suites = len(self.test_results)
            test_success_rate = (total_tests / total_test_suites * 100) if total_test_suites > 0 else 0
            
            # Generate report
            report = {
                "version": "1.37.0",
                "timestamp": datetime.datetime.now().isoformat(),
                "test_summary": {
                    "total_test_suites": total_test_suites,
                    "successful_suites": total_tests,
                    "failed_suites": total_test_suites - total_tests,
                    "success_rate": round(test_success_rate, 2)
                },
                "test_results": self.test_results,
                "coverage_data": self.coverage_data,
                "critical_issues_status": {
                    "purchase_payment_save": "FIXED" if self.test_results.get("smoke", {}).get("success", False) else "FAILING",
                    "invoice_payment_links": "FIXED" if self.test_results.get("smoke", {}).get("success", False) else "FAILING",
                    "invoice_list": "NEEDS_VERIFICATION"
                }
            }
            
            # Save report
            report_file = self.project_root / "test_reports" / "comprehensive_test_report.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            print("✅ Coverage report generated")
            
        except Exception as e:
            print(f"❌ Error generating coverage report: {e}")
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "="*60)
        print("📋 COMPREHENSIVE TEST SUMMARY")
        print("="*60)
        
        end_time = datetime.datetime.now()
        duration = end_time - self.start_time
        
        print(f"Test Run Duration: {duration}")
        print(f"Version: 1.37.0")
        print(f"Timestamp: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Test results summary
        print("Test Results:")
        for test_type, result in self.test_results.items():
            status = "✅ PASS" if result.get("success", False) else "❌ FAIL"
            print(f"  {test_type.title()}: {status}")
        
        print()
        
        # Critical issues status
        print("Critical Issues Status:")
        smoke_success = self.test_results.get("smoke", {}).get("success", False)
        print(f"  Purchase Payment Save: {'✅ FIXED' if smoke_success else '❌ FAILING'}")
        print(f"  Invoice Payment Links: {'✅ FIXED' if smoke_success else '❌ FAILING'}")
        print(f"  Invoice List: {'⚠️  NEEDS VERIFICATION'}")
        
        print()
        
        # Coverage summary
        if self.coverage_data:
            print("Coverage Summary:")
            total_coverage = self.coverage_data.get("totals", {}).get("percent_covered", 0)
            print(f"  Overall Coverage: {total_coverage:.1f}%")
        
        print()
        print("📁 Reports saved to:")
        print(f"  - test_reports/comprehensive_test_report.json")
        print(f"  - coverage_reports/backend/")
        print(f"  - test_reports/*.xml")
        
        print("="*60)
    
    def run_all_tests(self):
        """Run all tests and generate reports"""
        print("🚀 Starting Comprehensive Test Suite")
        print(f"Version: 1.37.0")
        print(f"Timestamp: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        # Setup environment
        self.setup_environment()
        
        # Run all test suites
        self.run_smoke_tests()
        self.run_backend_tests()
        self.run_integration_tests()
        self.run_frontend_tests()
        
        # Generate reports
        self.generate_coverage_report()
        self.generate_summary()
        
        # Return overall success
        all_success = all(result.get("success", False) for result in self.test_results.values())
        return 0 if all_success else 1

def main():
    """Main entry point"""
    runner = ComprehensiveTestRunner()
    exit_code = runner.run_all_tests()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
