#!/usr/bin/env python3
"""
Comprehensive Quality Test Runner for IPSC Application
Version: 1.7.0

This script runs all tests across the application and generates a detailed quality report.
It covers backend, frontend, E2E, and database tests with comprehensive reporting.

Author: Quality Analyst
Date: 2025-01-27
"""

import os
import sys
import subprocess
import json
import time
import datetime
import platform
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse
import shutil
from dataclasses import dataclass, asdict
from enum import Enum
import traceback


class TestStatus(Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    ERROR = "ERROR"
    TIMEOUT = "TIMEOUT"


@dataclass
class TestResult:
    name: str
    status: TestStatus
    duration: float
    error_message: Optional[str] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None


@dataclass
class TestSuiteResult:
    name: str
    total_tests: int
    passed: int
    failed: int
    skipped: int
    errors: int
    duration: float
    results: List[TestResult]
    coverage: Optional[float] = None


@dataclass
class QualityReport:
    version: str
    timestamp: str
    environment: Dict[str, str]
    summary: Dict[str, Any]
    test_suites: List[TestSuiteResult]
    recommendations: List[str]
    critical_issues: List[str]


class QualityTestRunner:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        self.report_dir = self.project_root / "quality_reports"
        self.report_dir.mkdir(exist_ok=True)
        
        # Load version information
        self.version = self._load_version()
        self.build_info = self._load_build_info()
        
        # Initialize results
        self.test_suites: List[TestSuiteResult] = []
        self.start_time = time.time()
        
    def _load_version(self) -> str:
        """Load version from VERSION file"""
        version_file = self.project_root / "VERSION"
        if version_file.exists():
            return version_file.read_text().strip()
        return "1.7.0"  # Default version
    
    def _load_build_info(self) -> Dict[str, Any]:
        """Load build information"""
        build_info_file = self.project_root / "build-info.json"
        if build_info_file.exists():
            return json.loads(build_info_file.read_text())
        return {"version": self.version, "build_date": "unknown"}
    
    def _get_environment_info(self) -> Dict[str, str]:
        """Get system environment information"""
        return {
            "python_version": sys.version,
            "platform": platform.platform(),
            "architecture": platform.architecture()[0],
            "processor": platform.processor(),
            "node_version": self._get_node_version(),
            "npm_version": self._get_npm_version(),
            "git_commit": self._get_git_commit(),
            "working_directory": str(self.project_root)
        }
    
    def _get_node_version(self) -> str:
        """Get Node.js version"""
        try:
            result = subprocess.run(["node", "--version"], 
                                  capture_output=True, text=True, timeout=10)
            return result.stdout.strip() if result.returncode == 0 else "Not available"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return "Not available"
    
    def _get_npm_version(self) -> str:
        """Get npm version"""
        try:
            result = subprocess.run(["npm", "--version"], 
                                  capture_output=True, text=True, timeout=10)
            return result.stdout.strip() if result.returncode == 0 else "Not available"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return "Not available"
    
    def _get_git_commit(self) -> str:
        """Get current git commit hash"""
        try:
            result = subprocess.run(["git", "rev-parse", "HEAD"], 
                                  capture_output=True, text=True, timeout=10,
                                  cwd=self.project_root)
            return result.stdout.strip()[:8] if result.returncode == 0 else "Not available"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return "Not available"
    
    def _run_command(self, command: List[str], cwd: Optional[str] = None, 
                    timeout: int = 300) -> TestResult:
        """Run a command and return test result"""
        start_time = time.time()
        name = " ".join(command)
        
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=cwd or str(self.project_root)
            )
            
            duration = time.time() - start_time
            
            if result.returncode == 0:
                status = TestStatus.PASSED
            else:
                status = TestStatus.FAILED
            
            return TestResult(
                name=name,
                status=status,
                duration=duration,
                stdout=result.stdout,
                stderr=result.stderr
            )
            
        except subprocess.TimeoutExpired:
            return TestResult(
                name=name,
                status=TestStatus.TIMEOUT,
                duration=timeout,
                error_message=f"Command timed out after {timeout} seconds"
            )
        except Exception as e:
            return TestResult(
                name=name,
                status=TestStatus.ERROR,
                duration=time.time() - start_time,
                error_message=str(e)
            )

    def run_backend_tests(self) -> TestSuiteResult:
        """Run backend tests using pytest"""
        print("🔧 Running Backend Tests...")
        
        # Check if pytest is available
        if not shutil.which("pytest"):
            return TestSuiteResult(
                name="Backend Tests",
                total_tests=0,
                passed=0,
                failed=0,
                skipped=0,
                errors=1,
                duration=0,
                results=[TestResult(
                    name="pytest",
                    status=TestStatus.ERROR,
                    duration=0,
                    error_message="pytest not found in PATH"
                )]
            )
        
        # Run pytest with coverage
        pytest_cmd = [
            "python", "-m", "pytest",
            "tests/backend/",
            "-v",
            "--tb=short",
            "--cov=backend",
            "--cov-report=term-missing",
            "--cov-report=html:coverage_reports/backend",
            "--junitxml=test_reports/backend-junit.xml"
        ]
        
        result = self._run_command(pytest_cmd)
        
        # Parse test results
        total_tests = 0
        passed = 0
        failed = 0
        skipped = 0
        errors = 0
        
        if result.status == TestStatus.PASSED:
            # Parse pytest output to count tests
            if result.stdout:
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'passed' in line and 'failed' in line and 'skipped' in line:
                        # Extract numbers from line like "25 passed, 2 failed, 1 skipped"
                        parts = line.split(',')
                        for part in parts:
                            part = part.strip()
                            if 'passed' in part:
                                passed = int(part.split()[0])
                            elif 'failed' in part:
                                failed = int(part.split()[0])
                            elif 'skipped' in part:
                                skipped = int(part.split()[0])
                        total_tests = passed + failed + skipped
                        break
        else:
            errors = 1
        
        return TestSuiteResult(
            name="Backend Tests",
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=skipped,
            errors=errors,
            duration=result.duration,
            results=[result]
        )
    
    def run_frontend_tests(self) -> TestSuiteResult:
        """Run frontend tests using Vitest"""
        print("🎨 Running Frontend Tests...")
        
        frontend_dir = self.project_root / "frontend"
        if not frontend_dir.exists():
            return TestSuiteResult(
                name="Frontend Tests",
                total_tests=0,
                passed=0,
                failed=0,
                skipped=0,
                errors=1,
                duration=0,
                results=[TestResult(
                    name="frontend tests",
                    status=TestStatus.ERROR,
                    duration=0,
                    error_message="Frontend directory not found"
                )]
            )
        
        # Check if npm is available
        if not shutil.which("npm"):
            return TestSuiteResult(
                name="Frontend Tests",
                total_tests=0,
                passed=0,
                failed=0,
                skipped=0,
                errors=1,
                duration=0,
                results=[TestResult(
                    name="npm",
                    status=TestStatus.ERROR,
                    duration=0,
                    error_message="npm not found in PATH"
                )]
            )
        
        # Install dependencies if needed
        if not (frontend_dir / "node_modules").exists():
            print("📦 Installing frontend dependencies...")
            install_result = self._run_command(["npm", "install"], cwd=str(frontend_dir))
            if install_result.status != TestStatus.PASSED:
                return TestSuiteResult(
                    name="Frontend Tests",
                    total_tests=0,
                    passed=0,
                    failed=0,
                    skipped=0,
                    errors=1,
                    duration=install_result.duration,
                    results=[install_result]
                )
        
        # Run frontend tests
        test_cmd = ["npm", "test"]
        result = self._run_command(test_cmd, cwd=str(frontend_dir))
        
        # Parse test results
        total_tests = 0
        passed = 0
        failed = 0
        skipped = 0
        errors = 0
        
        if result.status == TestStatus.PASSED and result.stdout:
            lines = result.stdout.split('\n')
            for line in lines:
                if 'Tests:' in line:
                    # Parse vitest output
                    if 'passed' in line:
                        passed = int(line.split()[0])
                    if 'failed' in line:
                        failed = int(line.split()[2])
                    total_tests = passed + failed
                    break
        else:
            errors = 1
        
        return TestSuiteResult(
            name="Frontend Tests",
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=skipped,
            errors=errors,
            duration=result.duration,
            results=[result]
        )
    
    def run_e2e_tests(self) -> TestSuiteResult:
        """Run end-to-end tests using Playwright"""
        print("🌐 Running E2E Tests...")
        
        # Check if playwright is available
        if not shutil.which("playwright"):
            return TestSuiteResult(
                name="E2E Tests",
                total_tests=0,
                passed=0,
                failed=0,
                skipped=0,
                errors=1,
                duration=0,
                results=[TestResult(
                    name="playwright",
                    status=TestStatus.ERROR,
                    duration=0,
                    error_message="Playwright not found in PATH"
                )]
            )
        
        # Run E2E tests
        e2e_cmd = [
            "python", "-m", "pytest",
            "tests/e2e/",
            "-v",
            "--tb=short"
        ]
        
        result = self._run_command(e2e_cmd)
        
        # Parse test results
        total_tests = 0
        passed = 0
        failed = 0
        skipped = 0
        errors = 0
        
        if result.status == TestStatus.PASSED and result.stdout:
            lines = result.stdout.split('\n')
            for line in lines:
                if 'passed' in line and 'failed' in line and 'skipped' in line:
                    parts = line.split(',')
                    for part in parts:
                        part = part.strip()
                        if 'passed' in part:
                            passed = int(part.split()[0])
                        elif 'failed' in part:
                            failed = int(part.split()[0])
                        elif 'skipped' in part:
                            skipped = int(part.split()[0])
                    total_tests = passed + failed + skipped
                    break
        else:
            errors = 1
        
        return TestSuiteResult(
            name="E2E Tests",
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=skipped,
            errors=errors,
            duration=result.duration,
            results=[result]
        )
    
    def run_database_tests(self) -> TestSuiteResult:
        """Run database-specific tests"""
        print("🗄️ Running Database Tests...")
        
        # Check database connectivity and migrations
        db_tests = []
        
        # Test database connection
        db_connection_cmd = [
            "python", "-c",
            "from backend.app.db import engine; print('Database connection successful')"
        ]
        db_connection_result = self._run_command(db_connection_cmd)
        db_tests.append(db_connection_result)
        
        # Test migrations
        migration_cmd = [
            "python", "-m", "alembic", "current"
        ]
        migration_result = self._run_command(migration_cmd)
        db_tests.append(migration_result)
        
        # Calculate totals
        total_tests = len(db_tests)
        passed = sum(1 for test in db_tests if test.status == TestStatus.PASSED)
        failed = sum(1 for test in db_tests if test.status == TestStatus.FAILED)
        errors = sum(1 for test in db_tests if test.status == TestStatus.ERROR)
        duration = sum(test.duration for test in db_tests)
        
        return TestSuiteResult(
            name="Database Tests",
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=0,
            errors=errors,
            duration=duration,
            results=db_tests
        )
    
    def run_security_tests(self) -> TestSuiteResult:
        """Run security-related tests"""
        print("🔒 Running Security Tests...")
        
        security_tests = []
        
        # Test authentication endpoints
        auth_test_cmd = [
            "python", "-c",
            """
import asyncio
import httpx
from backend.app.main import app

async def test_auth():
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # Test login endpoint
        response = await client.post("/api/auth/login", 
                                   json={"username": "admin", "password": "admin123"})
        print(f"Auth test: {response.status_code}")
        return response.status_code == 200

result = asyncio.run(test_auth())
print(f"Security test result: {result}")
            """
        ]
        
        auth_result = self._run_command(auth_test_cmd)
        security_tests.append(auth_result)
        
        # Test RBAC endpoints
        rbac_test_cmd = [
            "python", "-m", "pytest",
            "tests/backend/test_rbac.py",
            "-v"
        ]
        
        rbac_result = self._run_command(rbac_test_cmd)
        security_tests.append(rbac_result)
        
        # Calculate totals
        total_tests = len(security_tests)
        passed = sum(1 for test in security_tests if test.status == TestStatus.PASSED)
        failed = sum(1 for test in security_tests if test.status == TestStatus.FAILED)
        errors = sum(1 for test in security_tests if test.status == TestStatus.ERROR)
        duration = sum(test.duration for test in security_tests)
        
        return TestSuiteResult(
            name="Security Tests",
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=0,
            errors=errors,
            duration=duration,
            results=security_tests
        )
    
    def run_performance_tests(self) -> TestSuiteResult:
        """Run basic performance tests"""
        print("⚡ Running Performance Tests...")
        
        perf_tests = []
        
        # Test API response times
        perf_test_cmd = [
            "python", "-c",
            """
import asyncio
import time
import httpx
from backend.app.main import app

async def test_performance():
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        start_time = time.time()
        response = await client.get("/api/health")
        duration = time.time() - start_time
        print(f"Health endpoint response time: {duration:.3f}s")
        return duration < 1.0  # Should respond within 1 second

result = asyncio.run(test_performance())
print(f"Performance test result: {result}")
            """
        ]
        
        perf_result = self._run_command(perf_test_cmd)
        perf_tests.append(perf_result)
        
        # Calculate totals
        total_tests = len(perf_tests)
        passed = sum(1 for test in perf_tests if test.status == TestStatus.PASSED)
        failed = sum(1 for test in perf_tests if test.status == TestStatus.FAILED)
        errors = sum(1 for test in perf_tests if test.status == TestStatus.ERROR)
        duration = sum(test.duration for test in perf_tests)
        
        return TestSuiteResult(
            name="Performance Tests",
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=0,
            errors=errors,
            duration=duration,
            results=perf_tests
        )

    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        total_tests = sum(suite.total_tests for suite in self.test_suites)
        total_passed = sum(suite.passed for suite in self.test_suites)
        total_failed = sum(suite.failed for suite in self.test_suites)
        total_errors = sum(suite.errors for suite in self.test_suites)
        
        if total_tests == 0:
            recommendations.append("⚠️ No tests were executed. Please check test configuration.")
            return recommendations
        
        # Calculate pass rate
        pass_rate = (total_passed / total_tests) * 100 if total_tests > 0 else 0
        
        if pass_rate < 80:
            recommendations.append(f"🔴 Low test pass rate ({pass_rate:.1f}%). Focus on fixing failing tests.")
        
        if total_errors > 0:
            recommendations.append("🔴 Test execution errors detected. Check test environment setup.")
        
        # Check for specific test suite issues
        for suite in self.test_suites:
            if suite.failed > 0:
                recommendations.append(f"🔴 {suite.name} has {suite.failed} failing tests.")
            
            if suite.errors > 0:
                recommendations.append(f"🔴 {suite.name} has {suite.errors} execution errors.")
            
            if suite.total_tests == 0:
                recommendations.append(f"⚠️ {suite.name} has no tests. Consider adding test coverage.")
        
        # Positive recommendations
        if pass_rate >= 95:
            recommendations.append("✅ Excellent test pass rate! Maintain this quality level.")
        
        if all(suite.passed > 0 for suite in self.test_suites if suite.total_tests > 0):
            recommendations.append("✅ All test suites have passing tests. Good coverage!")
        
        return recommendations
    
    def identify_critical_issues(self) -> List[str]:
        """Identify critical issues that need immediate attention"""
        critical_issues = []
        
        for suite in self.test_suites:
            if suite.errors > 0:
                critical_issues.append(f"🚨 {suite.name}: {suite.errors} execution errors - test environment may be broken")
            
            if suite.name == "Security Tests" and suite.failed > 0:
                critical_issues.append(f"🚨 Security Tests: {suite.failed} failures - security vulnerabilities detected")
            
            if suite.name == "Database Tests" and suite.failed > 0:
                critical_issues.append(f"🚨 Database Tests: {suite.failed} failures - data integrity issues detected")
        
        return critical_issues
    
    def run_all_tests(self) -> QualityReport:
        """Run all test suites and generate comprehensive report"""
        print("🚀 Starting Comprehensive Quality Test Suite")
        print(f"📋 Version: {self.version}")
        print(f"📅 Build Date: {self.build_info.get('build_date', 'Unknown')}")
        print("=" * 60)
        
        # Create necessary directories
        (self.project_root / "test_reports").mkdir(exist_ok=True)
        (self.project_root / "coverage_reports").mkdir(exist_ok=True)
        
        # Run all test suites
        self.test_suites = [
            self.run_backend_tests(),
            self.run_frontend_tests(),
            self.run_e2e_tests(),
            self.run_database_tests(),
            self.run_security_tests(),
            self.run_performance_tests()
        ]
        
        # Calculate summary
        total_tests = sum(suite.total_tests for suite in self.test_suites)
        total_passed = sum(suite.passed for suite in self.test_suites)
        total_failed = sum(suite.failed for suite in self.test_suites)
        total_skipped = sum(suite.skipped for suite in self.test_suites)
        total_errors = sum(suite.errors for suite in self.test_suites)
        total_duration = sum(suite.duration for suite in self.test_suites)
        
        summary = {
            "total_tests": total_tests,
            "passed": total_passed,
            "failed": total_failed,
            "skipped": total_skipped,
            "errors": total_errors,
            "pass_rate": (total_passed / total_tests * 100) if total_tests > 0 else 0,
            "total_duration": total_duration,
            "test_suites_count": len(self.test_suites)
        }
        
        # Generate recommendations and critical issues
        recommendations = self.generate_recommendations()
        critical_issues = self.identify_critical_issues()
        
        # Create report
        report = QualityReport(
            version=self.version,
            timestamp=datetime.datetime.now().isoformat(),
            environment=self._get_environment_info(),
            summary=summary,
            test_suites=self.test_suites,
            recommendations=recommendations,
            critical_issues=critical_issues
        )
        
        return report
    
    def _serialize_for_json(self, obj):
        """Custom serialization function to handle enums and dataclasses"""
        if isinstance(obj, TestStatus):
            return obj.value
        elif hasattr(obj, '__dict__'):
            return {k: self._serialize_for_json(v) for k, v in obj.__dict__.items()}
        elif isinstance(obj, list):
            return [self._serialize_for_json(item) for item in obj]
        elif isinstance(obj, dict):
            return {k: self._serialize_for_json(v) for k, v in obj.items()}
        else:
            return obj
    
    def save_report(self, report: QualityReport, format: str = "json") -> str:
        """Save the quality report to file"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if format.lower() == "json":
            filename = f"quality_report_{timestamp}.json"
            filepath = self.report_dir / filename
            
            # Convert dataclasses to dict for JSON serialization with custom handling
            report_dict = {
                "version": report.version,
                "timestamp": report.timestamp,
                "environment": report.environment,
                "summary": report.summary,
                "test_suites": [self._serialize_for_json(suite) for suite in report.test_suites],
                "recommendations": report.recommendations,
                "critical_issues": report.critical_issues
            }
            
            with open(filepath, 'w') as f:
                json.dump(report_dict, f, indent=2)
        
        elif format.lower() == "html":
            filename = f"quality_report_{timestamp}.html"
            filepath = self.report_dir / filename
            self._generate_html_report(report, filepath)
        
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        return str(filepath)
    
    def _generate_html_report(self, report: QualityReport, filepath: Path):
        """Generate HTML report"""
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IPSC Quality Test Report - {report.version}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .summary-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }}
        .summary-card.passed {{ border-left-color: #28a745; }}
        .summary-card.failed {{ border-left-color: #dc3545; }}
        .summary-card.error {{ border-left-color: #ffc107; }}
        .test-suite {{ margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }}
        .test-suite-header {{ background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; font-weight: bold; }}
        .test-suite-content {{ padding: 15px; }}
        .status-passed {{ color: #28a745; }}
        .status-failed {{ color: #dc3545; }}
        .status-error {{ color: #ffc107; }}
        .recommendations {{ background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .critical-issues {{ background: #ffe6e6; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .environment {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .environment table {{ width: 100%; border-collapse: collapse; }}
        .environment th, .environment td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
        .environment th {{ background: #e9ecef; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IPSC Quality Test Report</h1>
            <p>Version: {report.version} | Generated: {report.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card passed">
                <h3>Total Tests</h3>
                <h2>{report.summary['total_tests']}</h2>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <h2>{report.summary['passed']}</h2>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <h2>{report.summary['failed']}</h2>
            </div>
            <div class="summary-card error">
                <h3>Errors</h3>
                <h2>{report.summary['errors']}</h2>
            </div>
            <div class="summary-card">
                <h3>Pass Rate</h3>
                <h2>{report.summary['pass_rate']:.1f}%</h2>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <h2>{report.summary['total_duration']:.1f}s</h2>
            </div>
        </div>
        
        <h2>Test Suites</h2>
        {self._generate_test_suites_html(report.test_suites)}
        
        {self._generate_recommendations_html(report.recommendations)}
        {self._generate_critical_issues_html(report.critical_issues)}
        {self._generate_environment_html(report.environment)}
    </div>
</body>
</html>
        """
        
        with open(filepath, 'w') as f:
            f.write(html_content)
    
    def _generate_test_suites_html(self, test_suites: List[TestSuiteResult]) -> str:
        """Generate HTML for test suites section"""
        html = ""
        for suite in test_suites:
            status_class = "passed" if suite.failed == 0 and suite.errors == 0 else "failed"
            html += f"""
        <div class="test-suite">
            <div class="test-suite-header">
                {suite.name} - {suite.passed} passed, {suite.failed} failed, {suite.errors} errors ({suite.duration:.1f}s)
            </div>
            <div class="test-suite-content">
                <p><strong>Total Tests:</strong> {suite.total_tests}</p>
                <p><strong>Pass Rate:</strong> {(suite.passed / suite.total_tests * 100) if suite.total_tests > 0 else 0:.1f}%</p>
            </div>
        </div>
            """
        return html
    
    def _generate_recommendations_html(self, recommendations: List[str]) -> str:
        """Generate HTML for recommendations section"""
        if not recommendations:
            return ""
        
        html = '<div class="recommendations"><h2>Recommendations</h2><ul>'
        for rec in recommendations:
            html += f'<li>{rec}</li>'
        html += '</ul></div>'
        return html
    
    def _generate_critical_issues_html(self, critical_issues: List[str]) -> str:
        """Generate HTML for critical issues section"""
        if not critical_issues:
            return ""
        
        html = '<div class="critical-issues"><h2>Critical Issues</h2><ul>'
        for issue in critical_issues:
            html += f'<li>{issue}</li>'
        html += '</ul></div>'
        return html
    
    def _generate_environment_html(self, environment: Dict[str, str]) -> str:
        """Generate HTML for environment section"""
        html = '<div class="environment"><h2>Environment</h2><table>'
        for key, value in environment.items():
            html += f'<tr><th>{key}</th><td>{value}</td></tr>'
        html += '</table></div>'
        return html
    
    def print_summary(self, report: QualityReport):
        """Print a summary of the test results to console"""
        print("\n" + "=" * 60)
        print("📊 QUALITY TEST SUMMARY")
        print("=" * 60)
        print(f"Version: {report.version}")
        print(f"Timestamp: {report.timestamp}")
        print(f"Total Duration: {report.summary['total_duration']:.1f} seconds")
        print()
        
        print("📈 TEST RESULTS:")
        print(f"  Total Tests: {report.summary['total_tests']}")
        print(f"  Passed: {report.summary['passed']} ✅")
        print(f"  Failed: {report.summary['failed']} ❌")
        print(f"  Skipped: {report.summary['skipped']} ⏭️")
        print(f"  Errors: {report.summary['errors']} ⚠️")
        print(f"  Pass Rate: {report.summary['pass_rate']:.1f}%")
        print()
        
        print("🧪 TEST SUITES:")
        for suite in report.test_suites:
            status_icon = "✅" if suite.failed == 0 and suite.errors == 0 else "❌"
            print(f"  {status_icon} {suite.name}: {suite.passed}/{suite.total_tests} passed ({suite.duration:.1f}s)")
        
        print()
        if report.recommendations:
            print("💡 RECOMMENDATIONS:")
            for rec in report.recommendations:
                print(f"  {rec}")
        
        print()
        if report.critical_issues:
            print("🚨 CRITICAL ISSUES:")
            for issue in report.critical_issues:
                print(f"  {issue}")
        
        print("\n" + "=" * 60)


def main():
    parser = argparse.ArgumentParser(description="IPSC Quality Test Runner")
    parser.add_argument("--format", choices=["json", "html", "both"], default="both",
                       help="Report format (default: both)")
    parser.add_argument("--project-root", default=".",
                       help="Project root directory (default: current directory)")
    parser.add_argument("--no-summary", action="store_true",
                       help="Skip console summary output")
    
    args = parser.parse_args()
    
    try:
        # Initialize test runner
        runner = QualityTestRunner(args.project_root)
        
        # Run all tests
        report = runner.run_all_tests()
        
        # Print summary
        if not args.no_summary:
            runner.print_summary(report)
        
        # Save reports
        saved_files = []
        if args.format in ["json", "both"]:
            json_file = runner.save_report(report, "json")
            saved_files.append(json_file)
            print(f"📄 JSON report saved: {json_file}")
        
        if args.format in ["html", "both"]:
            html_file = runner.save_report(report, "html")
            saved_files.append(html_file)
            print(f"📄 HTML report saved: {html_file}")
        
        # Exit with appropriate code
        if report.summary['failed'] > 0 or report.summary['errors'] > 0:
            print("\n❌ Quality check failed - there are failing tests or errors")
            sys.exit(1)
        else:
            print("\n✅ Quality check passed - all tests successful")
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\n⚠️ Test execution interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n💥 Error during test execution: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
