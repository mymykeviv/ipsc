#!/usr/bin/env python3
"""
Validation Script for CI/CD Fixes
Validates that all fixes are working correctly
"""

import os
import sys
import subprocess
import json
from pathlib import Path

class FixValidator:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.results = {}
        
    def validate_database_schema(self):
        """Validate database schema fixes"""
        print("🔍 Validating database schema fixes...")
        
        try:
            # Run the schema fix script
            script_path = self.project_root / "scripts" / "fix_database_schema.py"
            result = subprocess.run([sys.executable, str(script_path)], 
                                  capture_output=True, text=True)
            
            self.results["database_schema"] = {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
            if result.returncode == 0:
                print("✅ Database schema validation successful")
            else:
                print("❌ Database schema validation failed")
                print(result.stderr)
                
        except Exception as e:
            print(f"❌ Error validating database schema: {e}")
            self.results["database_schema"] = {"success": False, "error": str(e)}
    
    def validate_frontend_build(self):
        """Validate frontend build fixes"""
        print("🔍 Validating frontend build fixes...")
        
        try:
            frontend_dir = self.project_root / "frontend"
            
            # Test TypeScript compilation
            result = subprocess.run(["npm", "run", "build"], 
                                  capture_output=True, text=True, cwd=frontend_dir)
            
            self.results["frontend_build"] = {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
            if result.returncode == 0:
                print("✅ Frontend build validation successful")
            else:
                print("❌ Frontend build validation failed")
                print(result.stderr)
                
        except Exception as e:
            print(f"❌ Error validating frontend build: {e}")
            self.results["frontend_build"] = {"success": False, "error": str(e)}
    
    def validate_frontend_tests(self):
        """Validate frontend test fixes"""
        print("🔍 Validating frontend test fixes...")
        
        try:
            frontend_dir = self.project_root / "frontend"
            
            # Test frontend tests
            result = subprocess.run(["npm", "test"], 
                                  capture_output=True, text=True, cwd=frontend_dir)
            
            self.results["frontend_tests"] = {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
            if result.returncode == 0:
                print("✅ Frontend tests validation successful")
            else:
                print("❌ Frontend tests validation failed")
                print(result.stderr)
                
        except Exception as e:
            print(f"❌ Error validating frontend tests: {e}")
            self.results["frontend_tests"] = {"success": False, "error": str(e)}
    
    def validate_backend_tests(self):
        """Validate backend test fixes"""
        print("🔍 Validating backend test fixes...")
        
        try:
            backend_dir = self.project_root / "backend"
            
            # Test backend tests
            result = subprocess.run([sys.executable, "-m", "pytest", "tests/", "-v"], 
                                  capture_output=True, text=True, cwd=backend_dir)
            
            self.results["backend_tests"] = {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
            if result.returncode == 0:
                print("✅ Backend tests validation successful")
            else:
                print("❌ Backend tests validation failed")
                print(result.stderr)
                
        except Exception as e:
            print(f"❌ Error validating backend tests: {e}")
            self.results["backend_tests"] = {"success": False, "error": str(e)}
    
    def generate_report(self):
        """Generate validation report"""
        print("\n📊 Generating validation report...")
        
        report = {
            "timestamp": str(Path(__file__).stat().st_mtime),
            "fixes_validated": len(self.results),
            "successful_fixes": sum(1 for r in self.results.values() if r.get("success", False)),
            "failed_fixes": sum(1 for r in self.results.values() if not r.get("success", False)),
            "results": self.results
        }
        
        # Save report
        report_path = self.project_root / "test_reports" / "fix_validation_report.json"
        report_path.parent.mkdir(exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Report saved to: {report_path}")
        
        # Print summary
        print("\n" + "="*50)
        print("📋 FIX VALIDATION SUMMARY")
        print("="*50)
        
        for fix_name, result in self.results.items():
            status = "✅ PASS" if result.get("success", False) else "❌ FAIL"
            print(f"{fix_name.replace('_', ' ').title()}: {status}")
        
        success_rate = (report["successful_fixes"] / report["fixes_validated"]) * 100
        print(f"\nOverall Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 All critical fixes are working correctly!")
        else:
            print("⚠️  Some fixes need attention")

def main():
    print("🚀 Starting Fix Validation")
    print("="*50)
    
    validator = FixValidator()
    
    # Run all validations
    validator.validate_database_schema()
    validator.validate_frontend_build()
    validator.validate_frontend_tests()
    validator.validate_backend_tests()
    
    # Generate report
    validator.generate_report()

if __name__ == "__main__":
    main()
