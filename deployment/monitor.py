#!/usr/bin/env python3
"""
Cashflow Performance Monitor
===========================

This script monitors the performance and resource usage of the Cashflow application
to ensure it meets the low-resource requirements (4GB RAM, startup < 30s, < 1GB usage).

Usage:
    python deployment/monitor.py [options]

Options:
    --continuous: Run continuous monitoring
    --report: Generate performance report
    --alert: Send alerts for resource violations
    --help: Show this help message
"""

import subprocess
import json
import time
import psutil
import argparse
from datetime import datetime
from typing import Dict, List, Optional
import requests

class PerformanceMonitor:
    def __init__(self):
        self.start_time = datetime.now()
        self.metrics = []
        self.alerts = []
        
        # Resource limits (from Issue #18)
        self.limits = {
            "max_memory_mb": 1024,  # 1GB
            "max_cpu_percent": 80,
            "startup_time_seconds": 30,
            "response_time_seconds": 5
        }
        
    def log(self, message: str, level: str = "INFO") -> None:
        """Log a message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def get_docker_stats(self) -> Dict:
        """Get Docker container statistics"""
        try:
            result = subprocess.run(
                ["docker", "stats", "--no-stream", "--format", "json"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                stats = []
                for line in result.stdout.strip().split('\n'):
                    if line:
                        stats.append(json.loads(line))
                return stats
            else:
                self.log(f"Failed to get Docker stats: {result.stderr}", "ERROR")
                return []
        except Exception as e:
            self.log(f"Error getting Docker stats: {str(e)}", "ERROR")
            return []
            
    def get_system_stats(self) -> Dict:
        """Get system resource statistics"""
        try:
            return {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "memory_used_mb": psutil.virtual_memory().used / (1024 * 1024),
                "memory_total_mb": psutil.virtual_memory().total / (1024 * 1024),
                "disk_usage_percent": psutil.disk_usage('/').percent
            }
        except Exception as e:
            self.log(f"Error getting system stats: {str(e)}", "ERROR")
            return {}
            
    def check_service_health(self) -> Dict:
        """Check health of application services"""
        health_checks = {
            "backend": "http://localhost:8000/health",
            "frontend": "http://localhost:80/health"
        }
        
        results = {}
        for service, url in health_checks.items():
            try:
                start_time = time.time()
                response = requests.get(url, timeout=10)
                response_time = time.time() - start_time
                
                results[service] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_time": response_time,
                    "status_code": response.status_code
                }
                
                # Check response time limit
                if response_time > self.limits["response_time_seconds"]:
                    self.alerts.append(f"{service} response time ({response_time:.2f}s) exceeds limit ({self.limits['response_time_seconds']}s)")
                    
            except Exception as e:
                results[service] = {
                    "status": "error",
                    "error": str(e),
                    "response_time": None
                }
                self.alerts.append(f"{service} health check failed: {str(e)}")
                
        return results
        
    def analyze_docker_stats(self, stats: List[Dict]) -> Dict:
        """Analyze Docker container statistics"""
        analysis = {
            "total_memory_mb": 0,
            "total_cpu_percent": 0,
            "containers": {}
        }
        
        for container in stats:
            name = container.get("Name", "unknown")
            
            # Parse memory usage (e.g., "130.7MiB / 7.654GiB")
            memory_str = container.get("MemUsage", "0B / 0B")
            try:
                memory_used = memory_str.split('/')[0].strip()
                if 'MiB' in memory_used:
                    memory_mb = float(memory_used.replace('MiB', ''))
                elif 'GiB' in memory_used:
                    memory_mb = float(memory_used.replace('GiB', '')) * 1024
                else:
                    memory_mb = 0
            except:
                memory_mb = 0
                
            # Parse CPU usage (e.g., "25.09%")
            cpu_str = container.get("CPUPerc", "0%")
            try:
                cpu_percent = float(cpu_str.replace('%', ''))
            except:
                cpu_percent = 0
                
            analysis["containers"][name] = {
                "memory_mb": memory_mb,
                "cpu_percent": cpu_percent
            }
            
            analysis["total_memory_mb"] += memory_mb
            analysis["total_cpu_percent"] += cpu_percent
            
        return analysis
        
    def check_resource_limits(self, docker_analysis: Dict, system_stats: Dict) -> List[str]:
        """Check if resource usage exceeds limits"""
        violations = []
        
        # Check total memory usage
        total_memory = docker_analysis.get("total_memory_mb", 0)
        if total_memory > self.limits["max_memory_mb"]:
            violations.append(f"Total memory usage ({total_memory:.1f}MB) exceeds limit ({self.limits['max_memory_mb']}MB)")
            
        # Check system memory usage
        system_memory = system_stats.get("memory_used_mb", 0)
        if system_memory > self.limits["max_memory_mb"]:
            violations.append(f"System memory usage ({system_memory:.1f}MB) exceeds limit ({self.limits['max_memory_mb']}MB)")
            
        # Check CPU usage
        total_cpu = docker_analysis.get("total_cpu_percent", 0)
        if total_cpu > self.limits["max_cpu_percent"]:
            violations.append(f"Total CPU usage ({total_cpu:.1f}%) exceeds limit ({self.limits['max_cpu_percent']}%)")
            
        return violations
        
    def collect_metrics(self) -> Dict:
        """Collect all performance metrics"""
        timestamp = datetime.now()
        
        # Get Docker stats
        docker_stats = self.get_docker_stats()
        docker_analysis = self.analyze_docker_stats(docker_stats)
        
        # Get system stats
        system_stats = self.get_system_stats()
        
        # Check service health
        health_checks = self.check_service_health()
        
        # Check resource limits
        violations = self.check_resource_limits(docker_analysis, system_stats)
        
        # Create metrics record
        metrics = {
            "timestamp": timestamp.isoformat(),
            "docker_stats": docker_analysis,
            "system_stats": system_stats,
            "health_checks": health_checks,
            "violations": violations,
            "uptime_seconds": (timestamp - self.start_time).total_seconds()
        }
        
        self.metrics.append(metrics)
        
        # Log violations
        for violation in violations:
            self.log(f"RESOURCE VIOLATION: {violation}", "WARNING")
            
        return metrics
        
    def generate_report(self) -> Dict:
        """Generate a comprehensive performance report"""
        if not self.metrics:
            return {"error": "No metrics collected"}
            
        # Calculate averages
        total_memory_usage = [m["docker_stats"]["total_memory_mb"] for m in self.metrics]
        total_cpu_usage = [m["docker_stats"]["total_cpu_percent"] for m in self.metrics]
        response_times = []
        
        for m in self.metrics:
            for service, health in m["health_checks"].items():
                if health.get("response_time"):
                    response_times.append(health["response_time"])
                    
        # Calculate statistics
        report = {
            "monitoring_duration_seconds": (datetime.now() - self.start_time).total_seconds(),
            "samples_collected": len(self.metrics),
            "memory_usage": {
                "average_mb": sum(total_memory_usage) / len(total_memory_usage) if total_memory_usage else 0,
                "max_mb": max(total_memory_usage) if total_memory_usage else 0,
                "min_mb": min(total_memory_usage) if total_memory_usage else 0
            },
            "cpu_usage": {
                "average_percent": sum(total_cpu_usage) / len(total_cpu_usage) if total_cpu_usage else 0,
                "max_percent": max(total_cpu_usage) if total_cpu_usage else 0,
                "min_percent": min(total_cpu_usage) if total_cpu_usage else 0
            },
            "response_times": {
                "average_seconds": sum(response_times) / len(response_times) if response_times else 0,
                "max_seconds": max(response_times) if response_times else 0,
                "min_seconds": min(response_times) if response_times else 0
            },
            "violations": {
                "total_count": len(self.alerts),
                "memory_violations": len([a for a in self.alerts if "memory" in a.lower()]),
                "cpu_violations": len([a for a in self.alerts if "cpu" in a.lower()]),
                "response_time_violations": len([a for a in self.alerts if "response time" in a.lower()])
            },
            "compliance": {
                "meets_memory_limit": max(total_memory_usage) <= self.limits["max_memory_mb"] if total_memory_usage else True,
                "meets_cpu_limit": max(total_cpu_usage) <= self.limits["max_cpu_percent"] if total_cpu_usage else True,
                "meets_response_time_limit": max(response_times) <= self.limits["response_time_seconds"] if response_times else True
            }
        }
        
        return report
        
    def continuous_monitoring(self, interval: int = 30) -> None:
        """Run continuous monitoring"""
        self.log(f"Starting continuous monitoring (interval: {interval}s)", "INFO")
        
        try:
            while True:
                self.collect_metrics()
                time.sleep(interval)
        except KeyboardInterrupt:
            self.log("Monitoring stopped by user", "INFO")
            
    def save_report(self, filename: str = "performance_report.json") -> None:
        """Save performance report to file"""
        report = self.generate_report()
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
            
        self.log(f"Performance report saved to {filename}", "INFO")

def main():
    parser = argparse.ArgumentParser(description="Cashflow Performance Monitor")
    parser.add_argument("--continuous", action="store_true", help="Run continuous monitoring")
    parser.add_argument("--interval", type=int, default=30, help="Monitoring interval in seconds")
    parser.add_argument("--report", action="store_true", help="Generate performance report")
    parser.add_argument("--save", type=str, help="Save report to file")
    
    args = parser.parse_args()
    
    monitor = PerformanceMonitor()
    
    try:
        if args.continuous:
            monitor.continuous_monitoring(args.interval)
        else:
            # Single measurement
            metrics = monitor.collect_metrics()
            
            if args.report:
                report = monitor.generate_report()
                print(json.dumps(report, indent=2))
                
            if args.save:
                monitor.save_report(args.save)
            else:
                # Print summary
                print(f"Memory Usage: {metrics['docker_stats']['total_memory_mb']:.1f}MB")
                print(f"CPU Usage: {metrics['docker_stats']['total_cpu_percent']:.1f}%")
                print(f"Violations: {len(metrics['violations'])}")
                
    except Exception as e:
        monitor.log(f"Monitoring failed: {str(e)}", "ERROR")
        return 1
        
    return 0

if __name__ == "__main__":
    exit(main())
