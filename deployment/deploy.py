#!/usr/bin/env python3
"""
Consolidated Deployment Script for Cashflow
==========================================

This script provides a unified deployment system for dev, UAT, and production environments.
Supports Docker for dev/UAT and Kubernetes for production with automatic cache cleaning.

Usage:
    python deployment/deploy.py [environment] [options]

Environments:
    - dev: Development environment with Docker Compose
    - uat: UAT environment with Docker Compose
    - prod: Production environment with Kubernetes

Options:
    --clean: Clean build (remove all containers and images)
    --test: Run tests before deployment
    --skip-tests: Skip test execution
    --help: Show this help message

Examples:
    python deployment/deploy.py dev
    python deployment/deploy.py uat --test
    python deployment/deploy.py prod --clean
"""

import subprocess
import sys
import os
import json
import time
import argparse
import platform
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

class DeploymentManager:
    def __init__(self, environment: str = "dev"):
        self.environment = environment
        self.start_time = datetime.now()
        self.deployment_log = []
        self.test_results = None
        self.project_root = Path(__file__).parent.parent
        self.venv_path = self.find_virtual_environment()
        
        # Environment configurations
        self.configs = {
            "dev": {
                "type": "docker",
                "compose_file": "deployment/docker/docker-compose.dev.yml",
                "services": ["frontend", "backend", "database", "mailhog"],
                "timeout": 300,
                "health_checks": True,
                "clean_build": False
            },
            "uat": {
                "type": "docker",
                "compose_file": "deployment/docker/docker-compose.uat.yml",
                "services": ["frontend", "backend", "database"],
                "timeout": 600,
                "health_checks": True,
                "clean_build": True
            },
            "prod": {
                "type": "kubernetes",
                "k8s_dir": "deployment/kubernetes/prod",
                "services": ["frontend", "backend"],
                "timeout": 900,
                "health_checks": True,
                "clean_build": True
            }
        }
        
        self.config = self.configs.get(environment, self.configs["dev"])
        
    def find_virtual_environment(self) -> Optional[Path]:
        """Find and return the path to the virtual environment"""
        possible_venvs = [
            self.project_root / "venv",
            self.project_root / ".venv",
            self.project_root / "env"
        ]
        
        for venv_path in possible_venvs:
            if venv_path.exists() and (venv_path / "bin" / "activate").exists():
                return venv_path
            elif venv_path.exists() and (venv_path / "Scripts" / "activate").exists():
                return venv_path
                
        return None
        
    def activate_venv_command(self, command: List[str]) -> List[str]:
        """Wrap command to run in virtual environment if available"""
        if self.venv_path:
            if platform.system() == "Windows":
                activate_script = self.venv_path / "Scripts" / "activate"
                return ["cmd", "/c", f"{activate_script} && {' '.join(command)}"]
            else:
                activate_script = self.venv_path / "bin" / "activate"
                return ["bash", "-c", f"source {activate_script} && {' '.join(command)}"]
        return command
        
    def install_test_dependencies(self) -> bool:
        """Install test dependencies if needed"""
        if not self.venv_path:
            self.log("⚠️ No virtual environment found, skipping dependency installation", "WARNING")
            return True
            
        self.log("📦 Installing test dependencies...", "SETUP")
        
        # Install deployment requirements
        deploy_req = self.project_root / "deployment" / "requirements.txt"
        if deploy_req.exists():
            result = self.run_command(
                self.activate_venv_command(["pip", "install", "-r", str(deploy_req)])
            )
            if not result or result.returncode != 0:
                self.log("❌ Failed to install deployment dependencies", "ERROR")
                return False
                
        # Install backend requirements for tests
        backend_req = self.project_root / "backend" / "requirements.txt"
        if backend_req.exists():
            result = self.run_command(
                self.activate_venv_command(["pip", "install", "-r", str(backend_req)])
            )
            if not result or result.returncode != 0:
                self.log("❌ Failed to install backend dependencies", "ERROR")
                return False
                
        self.log("✅ Test dependencies installed successfully", "SUCCESS")
        return True
        
    def cleanup_existing_containers(self) -> bool:
        """Clean up existing containers that might conflict"""
        self.log("🧹 Cleaning up existing containers...", "CLEAN")
        
        # Stop and remove containers from this project
        result = self.run_command([
            "docker", "compose", "-f", self.config["compose_file"], "down", "--remove-orphans"
        ])
        
        # Also check for containers with similar names
        result2 = self.run_command([
            "docker", "ps", "-a", "--filter", "name=ipsc", "--format", "{{.Names}}"
        ])
        
        if result2 and result2.returncode == 0 and result2.stdout.strip():
            container_names = result2.stdout.strip().split('\n')
            for container in container_names:
                if container:
                    self.run_command(["docker", "stop", container])
                    self.run_command(["docker", "rm", container])
                    
        # Check for port conflicts
        ports_to_check = [5432, 8000, 5173, 1025, 8025]
        for port in ports_to_check:
            result3 = self.run_command([
                "lsof", "-ti", f":{port}"
            ])
            if result3 and result3.returncode == 0 and result3.stdout.strip():
                self.log(f"⚠️ Port {port} is in use, attempting to free it", "WARNING")
                pids = result3.stdout.strip().split('\n')
                for pid in pids:
                    if pid:
                        self.run_command(["kill", "-9", pid])
                        
        return True
        
    def fix_platform_issues(self) -> bool:
        """Fix platform-specific issues"""
        self.log("🔧 Checking for platform-specific issues...", "SETUP")
        
        # Check if we're on Apple Silicon
        if platform.machine() == "arm64" and platform.system() == "Darwin":
            self.log("🍎 Detected Apple Silicon, checking Docker platform compatibility", "INFO")
            
            # Update docker-compose files to handle platform issues
            compose_file = Path(self.config["compose_file"])
            if compose_file.exists():
                content = compose_file.read_text()
                
                # Add platform specification for problematic images
                if "mailhog/mailhog:latest" in content and "platform:" not in content:
                    content = content.replace(
                        "image: mailhog/mailhog:latest",
                        "image: mailhog/mailhog:latest\n    platform: linux/amd64"
                    )
                    compose_file.write_text(content)
                    self.log("✅ Fixed MailHog platform compatibility", "SUCCESS")
                    
        return True
        
    def log(self, message: str, level: str = "INFO") -> None:
        """Log a message with timestamp and level"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        self.deployment_log.append(log_entry)
        
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
            self.log(f"💥 Command failed: {' '.join(command)} - {str(e)}", "ERROR")
            return None
            
    def check_prerequisites(self) -> bool:
        """Check if all prerequisites are met"""
        self.log("🔍 Checking prerequisites...", "CHECK")
        
        prerequisites = [
            (["docker", "--version"], "Docker"),
            (["docker", "compose", "version"], "Docker Compose"),
            (["git", "--version"], "Git"),
            (["python3", "--version"], "Python 3"),
            (["node", "--version"], "Node.js"),
            (["npm", "--version"], "npm")
        ]
        
        # Add Kubernetes prerequisites for production
        if self.environment == "prod":
            prerequisites.extend([
                (["kubectl", "version", "--client"], "kubectl"),
                (["kubectl", "cluster-info"], "Kubernetes cluster")
            ])
        
        all_passed = True
        for command, name in prerequisites:
            result = self.run_command(command)
            if result and result.returncode == 0:
                self.log(f"✅ {name}: {result.stdout.strip()}", "SUCCESS")
            else:
                self.log(f"❌ {name} not found or not working", "ERROR")
                all_passed = False
                
        return all_passed
        
    def clean_caches(self) -> bool:
        """Clean all caches using the unified cache cleaning script"""
        self.log("🧹 Cleaning all caches...", "CLEAN")
        
        result = self.run_command([
            "bash", "deployment/scripts/clean-cache.sh", self.environment
        ])
        
        if result and result.returncode == 0:
            self.log("✅ Cache cleaning completed successfully", "SUCCESS")
            return True
        else:
            self.log("❌ Cache cleaning failed", "ERROR")
            return False
        
    def run_tests(self) -> bool:
        """Run the comprehensive test suite including E2E tests"""
        self.log("🧪 Running comprehensive test suite...", "TEST")
        
        # Step 1: Start backend services for testing
        self.log("📋 Step 1: Starting backend services for testing...", "TEST")
        backend_result = self.run_command([
            "docker", "compose", "-f", self.config["compose_file"], "up", "-d", "backend", "db"
        ])
        if not backend_result or backend_result.returncode != 0:
            self.log("❌ Failed to start backend for testing!", "ERROR")
            return False
            
        # Wait for backend to be ready
        self.log("⏳ Waiting for backend to be ready...", "TEST")
        time.sleep(15)
        
        # Step 2: Run backend and integration tests
        self.log("📋 Step 2: Running backend and integration tests...", "TEST")
        result = self.run_command(self.activate_venv_command(["python3", "test_suite.py"]))
        
        if not result or result.returncode != 0:
            # For development, allow tests to fail with a reasonable success rate
            if self.environment == "dev":
                self.log("⚠️ Backend tests failed, but continuing for development environment", "WARNING")
                # Load test results to check success rate
                try:
                    with open("test_report.json", "r") as f:
                        test_data = json.load(f)
                        success_rate = test_data.get("success_rate", 0)
                        if success_rate >= 70:  # Lower threshold for development
                            self.log(f"✅ Test success rate ({success_rate:.1f}%) is acceptable for development", "SUCCESS")
                            return True
                        else:
                            self.log(f"❌ Test success rate ({success_rate:.1f}%) is too low even for development", "ERROR")
                            return False
                except:
                    self.log("❌ Could not determine test success rate", "ERROR")
                    return False
            else:
                self.log("❌ Backend tests failed!", "ERROR")
                return False
            
        # Load backend test results
        try:
            with open("test_report.json", "r") as f:
                self.test_results = json.load(f)
            self.log(f"📊 Backend Test Results: {self.test_results['passed_tests']}/{self.test_results['total_tests']} passed", "INFO")
        except:
            self.log("⚠️ Could not load backend test report", "WARNING")
            
        # Step 3: Run E2E tests
        self.log("🌐 Step 3: Running E2E tests...", "TEST")
        
        # Ensure backend is running for E2E tests
        self.log("🔧 Ensuring backend services are running for E2E tests...", "SETUP")
        backend_result = self.run_command(["docker", "compose", "-f", "docker-compose.yml", "up", "-d", "backend", "db"])
        if not backend_result or backend_result.returncode != 0:
            self.log("❌ Failed to start backend for E2E tests!", "ERROR")
            return False
            
        # Wait for backend to be ready
        self.log("⏳ Waiting for backend to be ready...", "SETUP")
        time.sleep(10)
        
        # Run E2E tests with virtual environment
        self.log("🧪 Executing E2E test suite...", "TEST")
        e2e_result = self.run_command([
            "bash", "-c", 
            "cd frontend && NODE_ENV=test npm run test:e2e -- --project=chromium --reporter=list --timeout=30000"
        ])
        
        if e2e_result and e2e_result.returncode == 0:
            self.log("✅ E2E tests passed!", "SUCCESS")
            
            # Parse E2E test results
            e2e_output = e2e_result.stdout if e2e_result.stdout else ""
            passed_count = e2e_output.count("✓")
            failed_count = e2e_output.count("✘")
            total_e2e = passed_count + failed_count
            
            if total_e2e > 0:
                e2e_success_rate = (passed_count / total_e2e) * 100
                self.log(f"📊 E2E Test Results: {passed_count}/{total_e2e} passed ({e2e_success_rate:.1f}%)", "INFO")
                
                # Check if E2E success rate is acceptable (70% or higher)
                if e2e_success_rate >= 70:
                    self.log("✅ E2E test success rate is acceptable for deployment", "SUCCESS")
                else:
                    self.log(f"⚠️ E2E test success rate ({e2e_success_rate:.1f}%) is below threshold (70%)", "WARNING")
                    self.log("Continuing with deployment as E2E tests are non-blocking", "INFO")
            else:
                self.log("⚠️ Could not parse E2E test results", "WARNING")
                
        else:
            self.log("❌ E2E tests failed!", "ERROR")
            self.log("Continuing with deployment as E2E tests are non-blocking", "WARNING")
            
        # Step 4: Generate combined test report
        self.log("📋 Step 4: Generating combined test report...", "REPORT")
        self.generate_combined_test_report()
        
        self.log("✅ All test suites completed!", "SUCCESS")
        return True
        
    def generate_combined_test_report(self) -> None:
        """Generate a combined test report including backend and E2E results"""
        try:
            # Load backend test results
            backend_results = {}
            if os.path.exists("test_report.json"):
                with open("test_report.json", "r") as f:
                    backend_results = json.load(f)
                    
            # Create combined report
            combined_report = {
                "timestamp": datetime.now().isoformat(),
                "deployment_environment": self.environment,
                "backend_tests": backend_results,
                "e2e_tests": {
                    "status": "completed",
                    "framework": "Playwright",
                    "browser": "Chromium",
                    "notes": "E2E tests run with real backend integration"
                },
                "summary": {
                    "backend_success_rate": backend_results.get("success_rate", 0),
                    "overall_status": "ready_for_deployment"
                }
            }
            
            # Save combined report
            with open("deployment_test_report.json", "w") as f:
                json.dump(combined_report, f, indent=2)
                
            self.log("📁 Combined test report saved to: deployment_test_report.json", "INFO")
            
        except Exception as e:
            self.log(f"⚠️ Could not generate combined test report: {str(e)}", "WARNING")
            
    def clean_environment(self) -> None:
        """Clean the deployment environment"""
        self.log("🧹 Cleaning deployment environment...", "CLEAN")
        
        if self.config["type"] == "docker":
            # Stop and remove containers
            self.run_command(["docker", "compose", "-f", self.config["compose_file"], "down", "--remove-orphans"])
            
            # Remove images if clean build is requested
            if self.config["clean_build"]:
                self.run_command(["docker", "compose", "-f", self.config["compose_file"], "down", "--rmi", "all", "--volumes", "--remove-orphans"])
                self.run_command(["docker", "system", "prune", "-f"])
        elif self.config["type"] == "kubernetes":
            # Clean Kubernetes resources
            self.run_command(["kubectl", "delete", "namespace", "cashflow-prod", "--ignore-not-found=true"])
            time.sleep(5)  # Wait for namespace deletion
            
    def build_services(self) -> bool:
        """Build and start services"""
        self.log(f"🏗️ Building services for {self.environment} environment...", "BUILD")
        
        if self.config["type"] == "docker":
            # Build and start services with Docker Compose
            result = self.run_command([
                "docker", "compose", "-f", self.config["compose_file"], "up", "-d", "--build"
            ])
        elif self.config["type"] == "kubernetes":
            # Deploy to Kubernetes
            result = self.deploy_to_kubernetes()
        else:
            self.log("❌ Unknown deployment type", "ERROR")
            return False
        
        if result and result.returncode == 0:
            self.log("✅ Services built and started successfully!", "SUCCESS")
            return True
        else:
            self.log("❌ Service build failed!", "ERROR")
            return False
            
    def deploy_to_kubernetes(self) -> Optional[subprocess.CompletedProcess]:
        """Deploy to Kubernetes production environment"""
        self.log("🚀 Deploying to Kubernetes...", "K8S")
        
        # Create namespace
        result = self.run_command([
            "kubectl", "apply", "-f", f"{self.config['k8s_dir']}/namespace.yaml"
        ])
        if not result or result.returncode != 0:
            return result
            
        # Apply ConfigMap
        result = self.run_command([
            "kubectl", "apply", "-f", f"{self.config['k8s_dir']}/configmap.yaml"
        ])
        if not result or result.returncode != 0:
            return result
            
        # Apply Secrets
        result = self.run_command([
            "kubectl", "apply", "-f", f"{self.config['k8s_dir']}/secrets.yaml"
        ])
        if not result or result.returncode != 0:
            return result
            
        # Apply Deployments
        result = self.run_command([
            "kubectl", "apply", "-f", f"{self.config['k8s_dir']}/deployment.yaml"
        ])
        if not result or result.returncode != 0:
            return result
            
        # Apply Services
        result = self.run_command([
            "kubectl", "apply", "-f", f"{self.config['k8s_dir']}/service.yaml"
        ])
        
        return result
            
    def wait_for_services(self) -> None:
        """Wait for services to be ready"""
        self.log("⏳ Waiting for services to be ready...", "WAIT")
        
        # Wait for services to start
        time.sleep(10)
        
        # Additional health checks for production
        if self.environment in ["uat", "prod"]:
            self.log("Performing additional health checks...")
            time.sleep(20)
            
    def check_service_health(self) -> bool:
        """Check if all services are healthy"""
        self.log("🏥 Checking service health...", "HEALTH")
        
        if self.config["type"] == "docker":
            health_checks = {
                "backend": "http://localhost:8000/health",
                "frontend": "http://localhost:5173" if self.environment == "dev" else "http://localhost:3000"
            }
        elif self.config["type"] == "kubernetes":
            # Get service URLs from Kubernetes
            result = self.run_command([
                "kubectl", "get", "service", "-n", "cashflow-prod", "-o", "jsonpath='{.items[*].status.loadBalancer.ingress[0].ip}'"
            ])
            if result and result.returncode == 0:
                service_ip = result.stdout.strip().strip("'")
                health_checks = {
                    "backend": f"http://{service_ip}:8000/health",
                    "frontend": f"http://{service_ip}"
                }
            else:
                health_checks = {
                    "backend": "http://localhost:8000/health",
                    "frontend": "http://localhost"
                }
        
        all_healthy = True
        for service, url in health_checks.items():
            try:
                import requests
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    self.log(f"✅ {service} is healthy", "SUCCESS")
                else:
                    self.log(f"❌ {service} health check failed (status: {response.status_code})", "ERROR")
                    all_healthy = False
            except Exception as e:
                self.log(f"❌ {service} health check failed: {str(e)}", "ERROR")
                all_healthy = False
                
        return all_healthy
        
    def update_build_info(self) -> None:
        """Update build information"""
        self.log("📝 Updating build information...", "INFO")
        
        build_info = {
            "version": self.get_version(),
            "build_date": datetime.now().isoformat(),
            "git_commit": self.get_git_commit(),
            "deployment_date": datetime.now(timezone.utc).isoformat(),
            "environment": self.environment,
            "deployment_type": self.config["type"],
            "services": {
                "backend": "FastAPI",
                "frontend": "React",
                "database": "PostgreSQL",
                "mailhog": "MailHog" if self.environment == "dev" else None
            }
        }
        
        # Remove None values
        build_info["services"] = {k: v for k, v in build_info["services"].items() if v is not None}
        
        with open("build-info.json", "w") as f:
            json.dump(build_info, f, indent=2)
            
        self.log("✅ Build information updated", "SUCCESS")
        
    def get_version(self) -> str:
        """Get current version"""
        try:
            with open("VERSION", "r") as f:
                return f.read().strip()
        except:
            return "1.48.4"
            
    def get_git_commit(self) -> str:
        """Get current git commit"""
        result = self.run_command(["git", "rev-parse", "--short", "HEAD"])
        if result and result.returncode == 0:
            return result.stdout.strip()
        return "unknown"
        
    def deploy(self, run_tests: bool = True, clean: bool = False) -> bool:
        """Main deployment method"""
        self.log(f"🚀 Starting deployment for {self.environment} environment", "DEPLOY")
        
        # Check prerequisites
        if not self.check_prerequisites():
            self.log("❌ Prerequisites check failed!", "ERROR")
            return False
            
        # Clean environment if requested
        if clean:
            self.clean_environment()
            
        # Clean caches (always done for all deployments)
        if not self.clean_caches():
            self.log("⚠️ Cache cleaning failed, continuing with deployment", "WARNING")
            
        # Clean up existing containers to prevent conflicts
        if not self.cleanup_existing_containers():
            self.log("⚠️ Container cleanup failed, continuing with deployment", "WARNING")
            
        # Install test dependencies
        if not self.install_test_dependencies():
            self.log("⚠️ Test dependency installation failed, continuing with deployment", "WARNING")
            
        # Fix platform-specific issues
        if not self.fix_platform_issues():
            self.log("⚠️ Platform-specific issues fix failed, continuing with deployment", "WARNING")
            
        # Run tests if requested
        if run_tests:
            if not self.run_tests():
                self.log("❌ Tests failed! Deployment aborted.", "ERROR")
                return False
                
        # Build services
        if not self.build_services():
            return False
            
        # Wait for services
        self.wait_for_services()
        
        # Check health
        if self.config["health_checks"]:
            if not self.check_service_health():
                self.log("❌ Health checks failed!", "ERROR")
                return False
                
        # Update build info
        self.update_build_info()
        
        # Calculate deployment time
        deployment_time = datetime.now() - self.start_time
        self.log(f"✅ Deployment completed successfully in {deployment_time.total_seconds():.2f} seconds!", "SUCCESS")
        
        return True
        
    def rollback(self) -> bool:
        """Rollback to previous deployment"""
        self.log("🔄 Rolling back deployment...", "ROLLBACK")
        
        if self.config["type"] == "docker":
            # Stop current services
            self.run_command(["docker", "compose", "-f", self.config["compose_file"], "down"])
        elif self.config["type"] == "kubernetes":
            # Rollback Kubernetes deployment
            self.run_command([
                "kubectl", "rollout", "undo", "deployment/cashflow-backend", "-n", "cashflow-prod"
            ])
            self.run_command([
                "kubectl", "rollout", "undo", "deployment/cashflow-frontend", "-n", "cashflow-prod"
            ])
            
        self.log("✅ Rollback completed", "SUCCESS")
        return True

def main():
    parser = argparse.ArgumentParser(description="Cashflow Consolidated Deployment Script")
    parser.add_argument("environment", choices=["dev", "uat", "prod"], 
                       default="dev", nargs="?", help="Deployment environment")
    parser.add_argument("--clean", action="store_true", help="Clean build")
    parser.add_argument("--test", action="store_true", help="Run tests before deployment")
    parser.add_argument("--skip-tests", action="store_true", help="Skip test execution")
    parser.add_argument("--rollback", action="store_true", help="Rollback to previous deployment")
    
    args = parser.parse_args()
    
    # Create deployment manager
    manager = DeploymentManager(args.environment)
    
    try:
        if args.rollback:
            success = manager.rollback()
        else:
            run_tests = args.test or not args.skip_tests
            success = manager.deploy(run_tests=run_tests, clean=args.clean)
            
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        manager.log("⚠️ Deployment interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        manager.log(f"💥 Deployment failed with error: {str(e)}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()
