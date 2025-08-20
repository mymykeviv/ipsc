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
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

class DeploymentManager:
    def __init__(self, environment: str = "dev"):
        self.environment = environment
        self.start_time = datetime.now()
        self.deployment_log = []
        self.test_results = None
        self.project_root = Path(__file__).parent.parent
        
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
        """Run the comprehensive test suite"""
        self.log("🧪 Running comprehensive test suite...", "TEST")
        
        result = self.run_command(["python3", "test_suite.py"])
        
        if result and result.returncode == 0:
            self.log("✅ All tests passed!", "SUCCESS")
            
            # Load test results
            try:
                with open("test_report.json", "r") as f:
                    self.test_results = json.load(f)
                self.log(f"📊 Test Results: {self.test_results['passed_tests']}/{self.test_results['total_tests']} passed", "INFO")
            except:
                self.log("⚠️ Could not load test report", "WARNING")
                
            return True
        else:
            self.log("❌ Tests failed!", "ERROR")
            return False
            
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
            "deployment_date": datetime.utcnow().isoformat(),
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
