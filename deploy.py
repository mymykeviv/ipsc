#!/usr/bin/env python3

import subprocess
import sys
import os
import json
import time
from datetime import datetime

class DeploymentManager:
    def __init__(self):
        self.start_time = datetime.now()
        self.deployment_log = []
        self.test_results = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        self.deployment_log.append(log_entry)
        
    def run_command(self, command, cwd=None, timeout=300, capture_output=True):
        """Run a command and return the result"""
        try:
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=capture_output,
                text=True,
                timeout=timeout,
                shell=False
            )
            return result
        except subprocess.TimeoutExpired:
            self.log(f"Command timed out: {' '.join(command)}", "ERROR")
            return None
        except Exception as e:
            self.log(f"Command failed: {' '.join(command)} - {str(e)}", "ERROR")
            return None
            
    def check_prerequisites(self):
        """Check if all prerequisites are met"""
        self.log("🔍 Checking prerequisites...", "CHECK")
        
        # Check Python version
        result = self.run_command(["python3", "--version"])
        if result and result.returncode == 0:
            self.log(f"✅ Python: {result.stdout.strip()}", "SUCCESS")
        else:
            self.log("❌ Python not found or not working", "ERROR")
            return False
            
        # Check Node.js version
        result = self.run_command(["node", "--version"])
        if result and result.returncode == 0:
            self.log(f"✅ Node.js: {result.stdout.strip()}", "SUCCESS")
        else:
            self.log("❌ Node.js not found or not working", "ERROR")
            return False
            
        # Check npm
        result = self.run_command(["npm", "--version"])
        if result and result.returncode == 0:
            self.log(f"✅ npm: {result.stdout.strip()}", "SUCCESS")
        else:
            self.log("❌ npm not found or not working", "ERROR")
            return False
            
        # Check git
        result = self.run_command(["git", "--version"])
        if result and result.returncode == 0:
            self.log(f"✅ Git: {result.stdout.strip()}", "SUCCESS")
        else:
            self.log("❌ Git not found or not working", "ERROR")
            return False
            
        return True
        
    def run_comprehensive_tests(self):
        """Run the comprehensive test suite"""
        self.log("🧪 Running comprehensive test suite...", "TEST")
        
        # Run the test suite
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
            if result:
                self.log(f"Test output: {result.stderr}", "ERROR")
            return False
            
    def build_frontend(self):
        """Build the frontend application"""
        self.log("🏗️ Building frontend...", "BUILD")
        
        # Install dependencies
        result = self.run_command(["npm", "install"], cwd="frontend")
        if not result or result.returncode != 0:
            self.log("❌ Frontend dependency installation failed", "ERROR")
            return False
            
        # Build the application
        result = self.run_command(["npm", "run", "build"], cwd="frontend")
        if not result or result.returncode != 0:
            self.log("❌ Frontend build failed", "ERROR")
            if result:
                self.log(f"Build error: {result.stderr}", "ERROR")
            return False
            
        self.log("✅ Frontend build successful", "SUCCESS")
        return True
        
    def build_backend(self):
        """Build the backend application"""
        self.log("🏗️ Building backend...", "BUILD")
        
        # Check if virtual environment exists
        if not os.path.exists(".venv"):
            self.log("📦 Creating virtual environment...", "INFO")
            result = self.run_command(["python3", "-m", "venv", ".venv"])
            if not result or result.returncode != 0:
                self.log("❌ Virtual environment creation failed", "ERROR")
                return False
                
        # Install backend dependencies
        self.log("📦 Installing backend dependencies...", "INFO")
        result = self.run_command([".venv/bin/pip", "install", "-r", "backend/requirements.txt"])
        if not result or result.returncode != 0:
            self.log("❌ Backend dependency installation failed", "ERROR")
            return False
            
        self.log("✅ Backend build successful", "SUCCESS")
        return True
        
    def run_database_migrations(self):
        """Run database migrations"""
        self.log("🗄️ Running database migrations...", "DB")
        
        result = self.run_command([".venv/bin/python", "migrate.py", "upgrade"], cwd="backend")
        if not result or result.returncode != 0:
            self.log("❌ Database migration failed", "ERROR")
            if result:
                self.log(f"Migration error: {result.stderr}", "ERROR")
            return False
            
        self.log("✅ Database migrations successful", "SUCCESS")
        return True
        
    def update_version(self):
        """Update version number"""
        self.log("📝 Updating version...", "VERSION")
        
        try:
            with open("build-info.json", "r") as f:
                build_info = json.load(f)
                
            # Increment patch version
            current_version = build_info["version"]
            major, minor, patch = map(int, current_version.split("."))
            new_version = f"{major}.{minor}.{patch + 1}"
            
            build_info["version"] = new_version
            build_info["build_date"] = datetime.now().isoformat()
            
            with open("build-info.json", "w") as f:
                json.dump(build_info, f, indent=2)
                
            self.log(f"✅ Version updated to {new_version}", "SUCCESS")
            return new_version
        except Exception as e:
            self.log(f"❌ Version update failed: {str(e)}", "ERROR")
            return None
            
    def commit_changes(self, version):
        """Commit all changes to git"""
        self.log("📝 Committing changes...", "GIT")
        
        # Add all files
        result = self.run_command(["git", "add", "."])
        if not result or result.returncode != 0:
            self.log("❌ Git add failed", "ERROR")
            return False
            
        # Commit
        commit_message = f"Deploy version {version}\n\n- Automated deployment\n- All tests passed\n- Build successful"
        result = self.run_command(["git", "commit", "-m", commit_message])
        if not result or result.returncode != 0:
            self.log("❌ Git commit failed", "ERROR")
            return False
            
        # Tag the release
        result = self.run_command(["git", "tag", f"v{version}"])
        if not result or result.returncode != 0:
            self.log("⚠️ Git tag failed", "WARNING")
            
        self.log("✅ Changes committed successfully", "SUCCESS")
        return True
        
    def generate_deployment_report(self, version):
        """Generate deployment report"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        report = {
            "deployment": {
                "version": version,
                "timestamp": end_time.isoformat(),
                "duration": str(duration),
                "status": "success"
            },
            "test_results": self.test_results,
            "log": self.deployment_log
        }
        
        with open("deployment_report.json", "w") as f:
            json.dump(report, f, indent=2)
            
        self.log("📊 Deployment report generated", "REPORT")
        
    def deploy(self):
        """Main deployment process"""
        self.log("🚀 Starting deployment process...", "START")
        self.log(f"Timestamp: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}", "INFO")
        print("="*60)
        
        # Step 1: Check prerequisites
        if not self.check_prerequisites():
            self.log("❌ Prerequisites check failed", "ERROR")
            return 1
            
        # Step 2: Run comprehensive tests
        if not self.run_comprehensive_tests():
            self.log("❌ Test suite failed - deployment aborted", "ERROR")
            return 1
            
        # Step 3: Build frontend
        if not self.build_frontend():
            self.log("❌ Frontend build failed", "ERROR")
            return 1
            
        # Step 4: Build backend
        if not self.build_backend():
            self.log("❌ Backend build failed", "ERROR")
            return 1
            
        # Step 5: Run database migrations (optional for now)
        try:
            if not self.run_database_migrations():
                self.log("⚠️ Database migration failed - continuing with deployment", "WARNING")
        except Exception as e:
            self.log(f"⚠️ Database migration error - continuing with deployment: {str(e)}", "WARNING")
            
        # Step 6: Update version
        version = self.update_version()
        if not version:
            self.log("❌ Version update failed", "ERROR")
            return 1
            
        # Step 7: Commit changes
        if not self.commit_changes(version):
            self.log("❌ Git commit failed", "ERROR")
            return 1
            
        # Step 8: Generate report
        self.generate_deployment_report(version)
        
        # Success
        self.log("🎉 Deployment completed successfully!", "SUCCESS")
        self.log(f"Version {version} is ready for production", "SUCCESS")
        print("="*60)
        
        return 0

def main():
    deployer = DeploymentManager()
    exit_code = deployer.deploy()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
