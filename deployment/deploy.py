#!/usr/bin/env python3
"""
Consolidated Deployment Script for Cashflow
==========================================

This script consolidates all deployment functionality into a single, well-documented
system that supports multiple environments and deployment strategies.

Usage:
    python deployment/deploy.py [environment] [options]

Environments:
    - dev: Development environment with hot reloading
    - staging: Staging environment for testing
    - prod: Production environment with optimizations

Options:
    --clean: Clean build (remove all containers and images)
    --test: Run tests before deployment
    --skip-tests: Skip test execution
    --help: Show this help message

Examples:
    python deployment/deploy.py dev
    python deployment/deploy.py prod --test
    python deployment/deploy.py staging --clean
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
                "compose_file": "docker-compose.dev.yml",
                "services": ["frontend", "backend", "database", "mailhog"],
                "timeout": 300,
                "health_checks": True,
                "clean_build": False
            },
            "staging": {
                "compose_file": "docker-compose.yml",
                "services": ["frontend", "backend", "database"],
                "timeout": 600,
                "health_checks": True,
                "clean_build": True
            },
            "prod": {
                "compose_file": "docker-compose.prod.yml",
                "services": ["frontend", "backend", "database"],
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
        
        all_passed = True
        for command, name in prerequisites:
            result = self.run_command(command)
            if result and result.returncode == 0:
                self.log(f"✅ {name}: {result.stdout.strip()}", "SUCCESS")
            else:
                self.log(f"❌ {name} not found or not working", "ERROR")
                all_passed = False
                
        return all_passed
        
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
        
        # Stop and remove containers
        self.run_command(["docker", "compose", "-f", self.config["compose_file"], "down", "--remove-orphans"])
        
        # Remove images if clean build is requested
        if self.config["clean_build"]:
            self.run_command(["docker", "compose", "-f", self.config["compose_file"], "down", "--rmi", "all", "--volumes", "--remove-orphans"])
            self.run_command(["docker", "system", "prune", "-f"])
            
        # Clean frontend build artifacts
        if self.environment == "dev":
            self.log("Cleaning frontend build artifacts...")
            self.run_command(["find", "./frontend", "-name", "*.js", "-not", "-path", "./frontend/node_modules/*", "-delete"])
            self.run_command(["find", "./frontend", "-name", "*.js.map", "-not", "-path", "./frontend/node_modules/*", "-delete"])
            
    def build_services(self) -> bool:
        """Build and start services"""
        self.log(f"🏗️ Building services for {self.environment} environment...", "BUILD")
        
        # Build and start services
        result = self.run_command([
            "docker", "compose", "-f", self.config["compose_file"], "up", "-d", "--build"
        ])
        
        if result and result.returncode == 0:
            self.log("✅ Services built and started successfully!", "SUCCESS")
            return True
        else:
            self.log("❌ Service build failed!", "ERROR")
            return False
            
    def wait_for_services(self) -> None:
        """Wait for services to be ready"""
        self.log("⏳ Waiting for services to be ready...", "WAIT")
        
        # Wait for services to start
        time.sleep(10)
        
        # Additional health checks for production
        if self.environment in ["staging", "prod"]:
            self.log("Performing additional health checks...")
            time.sleep(20)
            
    def check_service_health(self) -> bool:
        """Check if all services are healthy"""
        self.log("🏥 Checking service health...", "HEALTH")
        
        health_checks = {
            "backend": "http://localhost:8000/health",
            "frontend": "http://localhost:5173" if self.environment == "dev" else "http://localhost:80"
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
            "services": {
                "backend": "FastAPI",
                "frontend": "React",
                "database": "SQLite" if self.environment == "dev" else "PostgreSQL",
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
            return "1.0.0"
            
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
        
        # Stop current services
        self.run_command(["docker", "compose", "-f", self.config["compose_file"], "down"])
        
        # TODO: Implement proper rollback logic
        self.log("⚠️ Rollback functionality not yet implemented", "WARNING")
        return False

def main():
    parser = argparse.ArgumentParser(description="Cashflow Deployment Script")
    parser.add_argument("environment", choices=["dev", "staging", "prod"], 
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
