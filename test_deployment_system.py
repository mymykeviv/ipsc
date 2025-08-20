#!/usr/bin/env python3
"""
Comprehensive Test Suite for Consolidated Deployment System
==========================================================

This script tests the new consolidated deployment system to ensure all functionality works correctly.
"""

import subprocess
import sys
import os
import json
import time
from datetime import datetime
from pathlib import Path

class DeploymentSystemTester:
    def __init__(self):
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "total": 0,
            "details": []
        }
        self.start_time = datetime.now()
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.test_results["total"] += 1
        if success:
            self.test_results["passed"] += 1
            print(f"✅ {test_name}: PASSED")
        else:
            self.test_results["failed"] += 1
            print(f"❌ {test_name}: FAILED - {details}")
            
        self.test_results["details"].append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
    def run_command(self, command: list, timeout: int = 60) -> tuple:
        """Run a command and return success status and output"""
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Command timed out"
        except Exception as e:
            return False, "", str(e)
            
    def test_deployment_script_exists(self):
        """Test that the main deployment script exists"""
        script_path = Path("deployment/deploy.py")
        success = script_path.exists()
        self.log_test(
            "Deployment script exists",
            success,
            f"Script found at {script_path}" if success else "Script not found"
        )
        
    def test_deployment_script_help(self):
        """Test that the deployment script shows help"""
        success, stdout, stderr = self.run_command([
            "python3", "deployment/deploy.py", "--help"
        ])
        
        expected_content = [
            "Cashflow Consolidated Deployment Script",
            "dev", "uat", "prod",
            "--clean", "--test", "--skip-tests", "--rollback"
        ]
        
        all_found = all(content in stdout for content in expected_content)
        self.log_test(
            "Deployment script help",
            success and all_found,
            f"Help output: {stdout[:200]}..." if success else f"Error: {stderr}"
        )
        
    def test_cache_cleaning_script_exists(self):
        """Test that the cache cleaning script exists"""
        script_path = Path("deployment/scripts/clean-cache.sh")
        success = script_path.exists()
        self.log_test(
            "Cache cleaning script exists",
            success,
            f"Script found at {script_path}" if success else "Script not found"
        )
        
    def test_cache_cleaning_script_executable(self):
        """Test that the cache cleaning script is executable"""
        script_path = Path("deployment/scripts/clean-cache.sh")
        success = os.access(script_path, os.X_OK)
        self.log_test(
            "Cache cleaning script executable",
            success,
            f"Script is executable" if success else "Script is not executable"
        )
        
    def test_cache_cleaning_script_help(self):
        """Test that the cache cleaning script works"""
        success, stdout, stderr = self.run_command([
            "bash", "deployment/scripts/clean-cache.sh", "dev"
        ])
        
        expected_content = [
            "Starting comprehensive cache cleaning",
            "Frontend caches cleaned",
            "Backend caches cleaned",
            "Docker caches cleaned"
        ]
        
        all_found = all(content in stdout for content in expected_content)
        self.log_test(
            "Cache cleaning script execution",
            success and all_found,
            f"Cache cleaning output: {stdout[:200]}..." if success else f"Error: {stderr}"
        )
        
    def test_docker_compose_files_exist(self):
        """Test that all Docker Compose files exist"""
        compose_files = [
            "deployment/docker/docker-compose.dev.yml",
            "deployment/docker/docker-compose.uat.yml",
            "deployment/docker/docker-compose.prod.yml"
        ]
        
        all_exist = True
        missing_files = []
        
        for file_path in compose_files:
            if not Path(file_path).exists():
                all_exist = False
                missing_files.append(file_path)
                
        self.log_test(
            "Docker Compose files exist",
            all_exist,
            f"All files found" if all_exist else f"Missing: {missing_files}"
        )
        
    def test_kubernetes_files_exist(self):
        """Test that all Kubernetes files exist"""
        k8s_files = [
            "deployment/kubernetes/prod/namespace.yaml",
            "deployment/kubernetes/prod/configmap.yaml",
            "deployment/kubernetes/prod/secrets.yaml",
            "deployment/kubernetes/prod/deployment.yaml",
            "deployment/kubernetes/prod/service.yaml"
        ]
        
        all_exist = True
        missing_files = []
        
        for file_path in k8s_files:
            if not Path(file_path).exists():
                all_exist = False
                missing_files.append(file_path)
                
        self.log_test(
            "Kubernetes files exist",
            all_exist,
            f"All files found" if all_exist else f"Missing: {missing_files}"
        )
        
    def test_old_deployment_files_removed(self):
        """Test that old deployment files have been removed"""
        old_files = [
            "deploy.py",
            "deploy.sh",
            "scripts/deploy.sh",
            "scripts/deploy-dev.sh",
            "scripts/docker-prod.sh",
            "scripts/docker-dev.sh",
            "scripts/k8s-prod.sh",
            "docker-compose.dev.yml",
            "docker-compose.optimized.yml",
            "docker-compose.prod.yml",
            "docker-compose.local.yml"
        ]
        
        all_removed = True
        existing_files = []
        
        for file_path in old_files:
            if Path(file_path).exists():
                all_removed = False
                existing_files.append(file_path)
                
        self.log_test(
            "Old deployment files removed",
            all_removed,
            f"All old files removed" if all_removed else f"Still exist: {existing_files}"
        )
        
    def test_docker_compose_validation(self):
        """Test that Docker Compose files are valid"""
        compose_files = [
            "deployment/docker/docker-compose.dev.yml",
            "deployment/docker/docker-compose.uat.yml",
            "deployment/docker/docker-compose.prod.yml"
        ]
        
        all_valid = True
        invalid_files = []
        
        for file_path in compose_files:
            success, stdout, stderr = self.run_command([
                "docker", "compose", "-f", file_path, "config"
            ])
            
            if not success:
                all_valid = False
                invalid_files.append(f"{file_path}: {stderr}")
                
        self.log_test(
            "Docker Compose validation",
            all_valid,
            f"All files valid" if all_valid else f"Invalid: {invalid_files}"
        )
        
    def test_kubernetes_validation(self):
        """Test that Kubernetes files are valid YAML"""
        k8s_files = [
            "deployment/kubernetes/prod/namespace.yaml",
            "deployment/kubernetes/prod/configmap.yaml",
            "deployment/kubernetes/prod/secrets.yaml",
            "deployment/kubernetes/prod/deployment.yaml",
            "deployment/kubernetes/prod/service.yaml"
        ]
        
        all_valid = True
        invalid_files = []
        
        for file_path in k8s_files:
            # Simple YAML validation by checking for basic structure
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    
                # Check for basic YAML structure (apiVersion, kind, metadata)
                if 'apiVersion:' in content and 'kind:' in content and 'metadata:' in content:
                    success = True
                else:
                    success = False
                    invalid_files.append(f"{file_path}: Missing required YAML structure")
                    
            except Exception as e:
                success = False
                invalid_files.append(f"{file_path}: {str(e)}")
                
        self.log_test(
            "Kubernetes YAML validation",
            all_valid,
            f"All files valid" if all_valid else f"Invalid: {invalid_files}"
        )
        
    def test_deployment_documentation_exists(self):
        """Test that deployment documentation exists and is updated"""
        doc_path = Path("docs/DEPLOYMENT.md")
        success = doc_path.exists()
        
        if success:
            with open(doc_path, 'r') as f:
                content = f.read()
                
            expected_content = [
                "Consolidated Deployment System",
                "Development (dev)",
                "UAT",
                "Production (prod)",
                "Cache Cleaning",
                "Kubernetes"
            ]
            
            all_found = all(content in content for content in expected_content)
            self.log_test(
                "Deployment documentation updated",
                all_found,
                f"Documentation contains all expected sections" if all_found else "Missing expected sections"
            )
        else:
            self.log_test(
                "Deployment documentation exists",
                False,
                "Documentation file not found"
            )
        
    def test_build_info_structure(self):
        """Test that build-info.json has the expected structure"""
        build_info_path = Path("build-info.json")
        success = build_info_path.exists()
        
        if success:
            try:
                with open(build_info_path, 'r') as f:
                    build_info = json.load(f)
                    
                expected_keys = ["version", "build_date", "changes", "features"]
                all_keys_present = all(key in build_info for key in expected_keys)
                
                self.log_test(
                    "Build info structure",
                    all_keys_present,
                    f"All expected keys present" if all_keys_present else f"Missing keys: {[k for k in expected_keys if k not in build_info]}"
                )
            except json.JSONDecodeError as e:
                self.log_test(
                    "Build info JSON valid",
                    False,
                    f"Invalid JSON: {str(e)}"
                )
        else:
            self.log_test(
                "Build info file exists",
                False,
                "Build info file not found"
            )
            
    def test_deployment_directory_structure(self):
        """Test that the deployment directory structure is correct"""
        expected_structure = [
            "deployment/",
            "deployment/docker/",
            "deployment/kubernetes/",
            "deployment/kubernetes/prod/",
            "deployment/scripts/"
        ]
        
        all_exist = True
        missing_dirs = []
        
        for dir_path in expected_structure:
            if not Path(dir_path).exists():
                all_exist = False
                missing_dirs.append(dir_path)
                
        self.log_test(
            "Deployment directory structure",
            all_exist,
            f"All directories exist" if all_exist else f"Missing: {missing_dirs}"
        )
        
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Running Comprehensive Deployment System Tests")
        print("=" * 60)
        
        # File existence tests
        self.test_deployment_script_exists()
        self.test_cache_cleaning_script_exists()
        self.test_cache_cleaning_script_executable()
        self.test_docker_compose_files_exist()
        self.test_kubernetes_files_exist()
        self.test_old_deployment_files_removed()
        self.test_deployment_directory_structure()
        
        # Validation tests
        self.test_deployment_script_help()
        self.test_cache_cleaning_script_help()
        self.test_docker_compose_validation()
        self.test_kubernetes_validation()
        
        # Documentation tests
        self.test_deployment_documentation_exists()
        self.test_build_info_structure()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 Test Summary")
        print("=" * 60)
        print(f"Total Tests: {self.test_results['total']}")
        print(f"Passed: {self.test_results['passed']}")
        print(f"Failed: {self.test_results['failed']}")
        print(f"Success Rate: {(self.test_results['passed'] / self.test_results['total'] * 100):.1f}%")
        
        # Save detailed results
        test_report = {
            "timestamp": datetime.now().isoformat(),
            "duration": str(datetime.now() - self.start_time),
            "summary": {
                "total": self.test_results["total"],
                "passed": self.test_results["passed"],
                "failed": self.test_results["failed"],
                "success_rate": self.test_results["passed"] / self.test_results["total"] * 100
            },
            "details": self.test_results["details"]
        }
        
        with open("deployment_test_report.json", "w") as f:
            json.dump(test_report, f, indent=2)
            
        print(f"\n📄 Detailed test report saved to: deployment_test_report.json")
        
        return self.test_results["failed"] == 0

def main():
    tester = DeploymentSystemTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
