#!/usr/bin/env python3
"""
E2E Test Runner for Deployment Pipeline
======================================

This script runs E2E tests as part of the deployment pipeline.
It ensures the backend is running, executes Playwright tests, and generates reports.

Usage:
    python deployment/run_e2e_tests.py [options]

Options:
    --environment: Test environment (dev, uat, prod)
    --browser: Browser to use (chromium, firefox, webkit)
    --timeout: Test timeout in seconds
    --parallel: Number of parallel workers
    --report: Generate detailed report
    --help: Show this help message

Examples:
    python deployment/run_e2e_tests.py --environment dev
    python deployment/run_e2e_tests.py --browser chromium --timeout 30000
"""

import subprocess
import sys
import os
import json
import time
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

class E2ETestRunner:
    def __init__(self, environment: str = "dev", browser: str = "chromium", 
                 timeout: int = 30000, parallel: int = 5):
        self.environment = environment
        self.browser = browser
        self.timeout = timeout
        self.parallel = parallel
        self.start_time = datetime.now()
        self.test_results = {}
        self.project_root = Path(__file__).parent.parent
        
    def log(self, message: str, level: str = "INFO") -> None:
        """Log a message with timestamp and level"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_command(self, command: List[str], cwd: Optional[Path] = None, 
                   timeout: int = 300, capture_output: bool = True) -> Optional[subprocess.CompletedProcess]:
        """Run a command and return the result"""
        try:
            cwd = cwd or self.project_root
            self.log(f"Running: {' '.join(command)}")
            
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=capture_output,
                text=True,
                timeout=timeout
            )
            
            if result.returncode == 0:
                self.log(f"✅ Command succeeded: {' '.join(command)}", "SUCCESS")
            else:
                self.log(f"❌ Command failed: {' '.join(command)}", "ERROR")
                if result.stderr:
                    self.log(f"Error: {result.stderr}", "ERROR")
                    
            return result
            
        except subprocess.TimeoutExpired:
            self.log(f"⏰ Command timed out: {' '.join(command)}", "ERROR")
            return None
        except Exception as e:
            self.log(f"💥 Command failed with exception: {str(e)}", "ERROR")
            return None
            
    def ensure_backend_running(self) -> bool:
        """Ensure backend services are running for E2E tests"""
        self.log("🔧 Ensuring backend services are running...", "SETUP")
        
        # Check if backend is already running
        health_check = self.run_command(["curl", "-f", "http://localhost:8000/health"], 
                                       timeout=5, capture_output=True)
        if health_check and health_check.returncode == 0:
            self.log("✅ Backend is already running", "SUCCESS")
            return True
            
        # Start backend services
        self.log("🚀 Starting backend services...", "SETUP")
        backend_result = self.run_command([
            "docker", "compose", "-f", "docker-compose.yml", "up", "-d", "backend", "db"
        ])
        
        if not backend_result or backend_result.returncode != 0:
            self.log("❌ Failed to start backend services!", "ERROR")
            return False
            
        # Wait for backend to be ready
        self.log("⏳ Waiting for backend to be ready...", "SETUP")
        for attempt in range(30):  # Wait up to 30 seconds
            time.sleep(1)
            health_check = self.run_command(["curl", "-f", "http://localhost:8000/health"], 
                                           timeout=5, capture_output=True)
            if health_check and health_check.returncode == 0:
                self.log(f"✅ Backend is ready after {attempt + 1} seconds", "SUCCESS")
                return True
                
        self.log("❌ Backend failed to start within timeout!", "ERROR")
        return False
        
    def run_e2e_tests(self) -> bool:
        """Run the E2E test suite"""
        self.log("🧪 Running E2E test suite...", "TEST")
        
        # Ensure backend is running
        if not self.ensure_backend_running():
            return False
            
        # Run E2E tests
        test_command = [
            "bash", "-c",
            f"cd frontend && NODE_ENV=test npm run test:e2e -- --project={self.browser} --reporter=list --timeout={self.timeout} --workers={self.parallel}"
        ]
        
        result = self.run_command(test_command, timeout=600)  # 10 minute timeout for E2E tests
        
        if result and result.returncode == 0:
            self.log("✅ E2E tests completed successfully!", "SUCCESS")
            self.parse_test_results(result.stdout)
            return True
        else:
            self.log("❌ E2E tests failed!", "ERROR")
            if result and result.stdout:
                self.parse_test_results(result.stdout)
            return False
            
    def parse_test_results(self, output: str) -> None:
        """Parse test results from output"""
        try:
            # Count passed and failed tests
            passed_count = output.count("✓")
            failed_count = output.count("✘")
            total_tests = passed_count + failed_count
            
            if total_tests > 0:
                success_rate = (passed_count / total_tests) * 100
                
                self.test_results = {
                    "total_tests": total_tests,
                    "passed_tests": passed_count,
                    "failed_tests": failed_count,
                    "success_rate": success_rate,
                    "browser": self.browser,
                    "environment": self.environment,
                    "timestamp": datetime.now().isoformat()
                }
                
                self.log(f"📊 E2E Test Results: {passed_count}/{total_tests} passed ({success_rate:.1f}%)", "INFO")
            else:
                self.log("⚠️ Could not parse test results", "WARNING")
                
        except Exception as e:
            self.log(f"⚠️ Error parsing test results: {str(e)}", "WARNING")
            
    def generate_report(self) -> None:
        """Generate E2E test report"""
        if not self.test_results:
            self.log("⚠️ No test results to report", "WARNING")
            return
            
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        report = {
            "e2e_test_report": {
                "timestamp": end_time.isoformat(),
                "duration": str(duration),
                "environment": self.environment,
                "browser": self.browser,
                "results": self.test_results,
                "summary": {
                    "status": "passed" if self.test_results.get("success_rate", 0) >= 70 else "failed",
                    "recommendation": "ready_for_deployment" if self.test_results.get("success_rate", 0) >= 70 else "review_required"
                }
            }
        }
        
        # Save report
        report_file = f"e2e_test_report_{self.environment}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
            
        self.log(f"📁 E2E test report saved to: {report_file}", "INFO")
        
        # Print summary
        print("\n" + "="*60)
        print("🌐 E2E TEST SUMMARY")
        print("="*60)
        print(f"Environment: {self.environment}")
        print(f"Browser: {self.browser}")
        print(f"Duration: {duration}")
        print(f"Total Tests: {self.test_results.get('total_tests', 0)}")
        print(f"Passed: {self.test_results.get('passed_tests', 0)}")
        print(f"Failed: {self.test_results.get('failed_tests', 0)}")
        print(f"Success Rate: {self.test_results.get('success_rate', 0):.1f}%")
        print(f"Status: {report['e2e_test_report']['summary']['status'].upper()}")
        print("="*60)
        
    def run(self) -> bool:
        """Main method to run E2E tests"""
        self.log("🚀 Starting E2E Test Runner", "START")
        self.log(f"Environment: {self.environment}", "INFO")
        self.log(f"Browser: {self.browser}", "INFO")
        self.log(f"Timeout: {self.timeout}ms", "INFO")
        
        try:
            # Run E2E tests
            success = self.run_e2e_tests()
            
            # Generate report
            self.generate_report()
            
            # Return success based on threshold
            if success and self.test_results.get("success_rate", 0) >= 70:
                self.log("✅ E2E tests passed with acceptable success rate!", "SUCCESS")
                return True
            elif success:
                self.log("⚠️ E2E tests completed but success rate is below threshold", "WARNING")
                return True  # Non-blocking
            else:
                self.log("❌ E2E tests failed!", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"💥 E2E test runner failed with error: {str(e)}", "ERROR")
            return False

def main():
    parser = argparse.ArgumentParser(description="E2E Test Runner for Deployment Pipeline")
    parser.add_argument("--environment", choices=["dev", "uat", "prod"], 
                       default="dev", help="Test environment")
    parser.add_argument("--browser", choices=["chromium", "firefox", "webkit"], 
                       default="chromium", help="Browser to use")
    parser.add_argument("--timeout", type=int, default=30000, 
                       help="Test timeout in milliseconds")
    parser.add_argument("--parallel", type=int, default=5, 
                       help="Number of parallel workers")
    parser.add_argument("--report", action="store_true", 
                       help="Generate detailed report")
    
    args = parser.parse_args()
    
    # Create test runner
    runner = E2ETestRunner(
        environment=args.environment,
        browser=args.browser,
        timeout=args.timeout,
        parallel=args.parallel
    )
    
    try:
        success = runner.run()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        runner.log("⚠️ E2E test run interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        runner.log(f"💥 E2E test run failed with error: {str(e)}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()
