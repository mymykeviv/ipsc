"""
Structured Logging Configuration for CASHFLOW Backend
Provides centralized logging with different levels and outputs
"""

import logging
import logging.config
import sys
from datetime import datetime
from typing import Dict, Any
import json
from pathlib import Path


class StructuredFormatter(logging.Formatter):
    """Structured JSON formatter for logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
        
        return json.dumps(log_entry)


class RequestFormatter(logging.Formatter):
    """Formatter for HTTP request logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format request log record"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'type': 'http_request',
            'method': getattr(record, 'method', ''),
            'path': getattr(record, 'path', ''),
            'status_code': getattr(record, 'status_code', ''),
            'duration': getattr(record, 'duration', 0),
            'client_ip': getattr(record, 'client_ip', ''),
            'user_agent': getattr(record, 'user_agent', '')
        }
        
        return json.dumps(log_entry)


def setup_logging(
    log_level: str = "INFO",
    log_file: str = None,
    enable_json: bool = True,
    enable_console: bool = True
) -> None:
    """Setup logging configuration"""
    
    # Create logs directory if it doesn't exist
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Define loggers
    loggers = {
        '': {
            'handlers': [],
            'level': log_level,
            'propagate': False
        },
        'app': {
            'handlers': [],
            'level': log_level,
            'propagate': False
        },
        'app.auth': {
            'handlers': [],
            'level': log_level,
            'propagate': False
        },
        'app.routers': {
            'handlers': [],
            'level': log_level,
            'propagate': False
        },
        'app.db': {
            'handlers': [],
            'level': log_level,
            'propagate': False
        },
        'app.monitoring': {
            'handlers': [],
            'level': log_level,
            'propagate': False
        },
        'uvicorn': {
            'handlers': [],
            'level': 'INFO',
            'propagate': False
        },
        'uvicorn.access': {
            'handlers': [],
            'level': 'INFO',
            'propagate': False
        }
    }
    
    # Define handlers
    handlers = {}
    
    if enable_console:
        handlers['console'] = {
            'class': 'logging.StreamHandler',
            'level': log_level,
            'formatter': 'structured' if enable_json else 'simple',
            'stream': sys.stdout
        }
    
    if log_file:
        handlers['file'] = {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': log_level,
            'formatter': 'structured' if enable_json else 'simple',
            'filename': log_file,
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        }
    
    # Define formatters
    formatters = {
        'structured': {
            '()': StructuredFormatter
        },
        'simple': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'request': {
            '()': RequestFormatter
        }
    }
    
    # Add handlers to loggers
    for logger_name in loggers:
        loggers[logger_name]['handlers'] = list(handlers.keys())
    
    # Configure logging
    logging.config.dictConfig({
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': formatters,
        'handlers': handlers,
        'loggers': loggers
    })


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(name)


def log_request(
    logger: logging.Logger,
    method: str,
    path: str,
    status_code: int,
    duration: float,
    client_ip: str = None,
    user_agent: str = None
) -> None:
    """Log HTTP request details"""
    record = logging.LogRecord(
        name=logger.name,
        level=logging.INFO,
        pathname='',
        lineno=0,
        msg='HTTP Request',
        args=(),
        exc_info=None
    )
    
    record.method = method
    record.path = path
    record.status_code = status_code
    record.duration = duration
    record.client_ip = client_ip
    record.user_agent = user_agent
    
    logger.handle(record)


def log_business_event(
    logger: logging.Logger,
    event_type: str,
    event_data: Dict[str, Any],
    user_id: str = None
) -> None:
    """Log business events"""
    extra_fields = {
        'event_type': event_type,
        'event_data': event_data,
        'user_id': user_id
    }
    
    record = logging.LogRecord(
        name=logger.name,
        level=logging.INFO,
        pathname='',
        lineno=0,
        msg=f'Business Event: {event_type}',
        args=(),
        exc_info=None
    )
    
    record.extra_fields = extra_fields
    logger.handle(record)


def log_security_event(
    logger: logging.Logger,
    event_type: str,
    details: Dict[str, Any],
    severity: str = 'medium'
) -> None:
    """Log security events"""
    extra_fields = {
        'event_type': event_type,
        'security_details': details,
        'severity': severity
    }
    
    record = logging.LogRecord(
        name=logger.name,
        level=logging.WARNING,
        pathname='',
        lineno=0,
        msg=f'Security Event: {event_type}',
        args=(),
        exc_info=None
    )
    
    record.extra_fields = extra_fields
    logger.handle(record)


def log_performance_metric(
    logger: logging.Logger,
    metric_name: str,
    value: float,
    unit: str = None,
    tags: Dict[str, str] = None
) -> None:
    """Log performance metrics"""
    extra_fields = {
        'metric_name': metric_name,
        'value': value,
        'unit': unit,
        'tags': tags or {}
    }
    
    record = logging.LogRecord(
        name=logger.name,
        level=logging.INFO,
        pathname='',
        lineno=0,
        msg=f'Performance Metric: {metric_name}',
        args=(),
        exc_info=None
    )
    
    record.extra_fields = extra_fields
    logger.handle(record)
