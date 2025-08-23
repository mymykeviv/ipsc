"""
Standardized Error Handling Utilities
Provides consistent error responses and error management across the application
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Custom API error class for standardized error handling"""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 400, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(APIError):
    """Validation error for input validation failures"""
    
    def __init__(self, message: str, field: Optional[str] = None, value: Optional[Any] = None):
        details = {}
        if field:
            details["field"] = field
        if value is not None:
            details["value"] = value
        
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details
        )


class AuthenticationError(APIError):
    """Authentication error for authentication failures"""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(APIError):
    """Authorization error for permission failures"""
    
    def __init__(self, message: str = "Insufficient permissions", resource: Optional[str] = None):
        details = {}
        if resource:
            details["resource"] = resource
        
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


class NotFoundError(APIError):
    """Not found error for missing resources"""
    
    def __init__(self, message: str, resource_type: Optional[str] = None, resource_id: Optional[str] = None):
        details = {}
        if resource_type:
            details["resource_type"] = resource_type
        if resource_id:
            details["resource_id"] = resource_id
        
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details=details
        )


class ConflictError(APIError):
    """Conflict error for resource conflicts"""
    
    def __init__(self, message: str, resource_type: Optional[str] = None):
        details = {}
        if resource_type:
            details["resource_type"] = resource_type
        
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
            details=details
        )


class RateLimitError(APIError):
    """Rate limit error for rate limiting violations"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        details = {}
        if retry_after:
            details["retry_after"] = retry_after
        
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details
        )


class InternalServerError(APIError):
    """Internal server error for unexpected errors"""
    
    def __init__(self, message: str = "Internal server error", error_id: Optional[str] = None):
        details = {}
        if error_id:
            details["error_id"] = error_id
        
        super().__init__(
            message=message,
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
            details=details
        )


def create_error_response(error: APIError) -> JSONResponse:
    """
    Create a standardized error response
    
    Args:
        error: The APIError instance
        
    Returns:
        JSONResponse: Standardized error response
    """
    response_data = {
        "error": {
            "message": error.message,
            "code": error.error_code,
            "status_code": error.status_code,
            "timestamp": datetime.utcnow().isoformat(),
            "details": error.details
        }
    }
    
    return JSONResponse(
        status_code=error.status_code,
        content=response_data
    )


def create_validation_error_response(field: str, message: str, value: Optional[Any] = None) -> JSONResponse:
    """
    Create a validation error response
    
    Args:
        field: The field that failed validation
        message: The validation error message
        value: The invalid value (optional)
        
    Returns:
        JSONResponse: Validation error response
    """
    error = ValidationError(message, field, value)
    return create_error_response(error)


def create_not_found_response(resource_type: str, resource_id: str) -> JSONResponse:
    """
    Create a not found error response
    
    Args:
        resource_type: The type of resource that was not found
        resource_id: The ID of the resource that was not found
        
    Returns:
        JSONResponse: Not found error response
    """
    error = NotFoundError(f"{resource_type} not found", resource_type, resource_id)
    return create_error_response(error)


def create_unauthorized_response(message: str = "Authentication required") -> JSONResponse:
    """
    Create an unauthorized error response
    
    Args:
        message: The error message
        
    Returns:
        JSONResponse: Unauthorized error response
    """
    error = AuthenticationError(message)
    return create_error_response(error)


def create_forbidden_response(message: str = "Insufficient permissions", resource: Optional[str] = None) -> JSONResponse:
    """
    Create a forbidden error response
    
    Args:
        message: The error message
        resource: The resource that was accessed (optional)
        
    Returns:
        JSONResponse: Forbidden error response
    """
    error = AuthorizationError(message, resource)
    return create_error_response(error)


def create_conflict_response(message: str, resource_type: Optional[str] = None) -> JSONResponse:
    """
    Create a conflict error response
    
    Args:
        message: The error message
        resource_type: The type of resource that caused the conflict (optional)
        
    Returns:
        JSONResponse: Conflict error response
    """
    error = ConflictError(message, resource_type)
    return create_error_response(error)


def create_rate_limit_response(message: str = "Rate limit exceeded", retry_after: Optional[int] = None) -> JSONResponse:
    """
    Create a rate limit error response
    
    Args:
        message: The error message
        retry_after: Seconds to wait before retrying (optional)
        
    Returns:
        JSONResponse: Rate limit error response
    """
    error = RateLimitError(message, retry_after)
    return create_error_response(error)


def create_internal_error_response(message: str = "Internal server error", error_id: Optional[str] = None) -> JSONResponse:
    """
    Create an internal server error response
    
    Args:
        message: The error message
        error_id: Unique error identifier for tracking (optional)
        
    Returns:
        JSONResponse: Internal server error response
    """
    error = InternalServerError(message, error_id)
    return create_error_response(error)


def handle_api_error(error: Exception) -> JSONResponse:
    """
    Handle any exception and convert it to a standardized error response
    
    Args:
        error: The exception to handle
        
    Returns:
        JSONResponse: Standardized error response
    """
    if isinstance(error, APIError):
        return create_error_response(error)
    
    # Log unexpected errors
    logger.error(f"Unexpected error: {error}", exc_info=True)
    
    # Convert to internal server error
    return create_internal_error_response(
        message="An unexpected error occurred",
        error_id=f"ERR_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    )


def validate_required_field(value: Any, field_name: str) -> None:
    """
    Validate that a required field is present and not empty
    
    Args:
        value: The value to validate
        field_name: The name of the field
        
    Raises:
        ValidationError: If the field is missing or empty
    """
    if value is None:
        raise ValidationError(f"{field_name} is required", field_name)
    
    if isinstance(value, str) and not value.strip():
        raise ValidationError(f"{field_name} cannot be empty", field_name, value)
    
    if isinstance(value, (list, dict)) and not value:
        raise ValidationError(f"{field_name} cannot be empty", field_name, value)


def validate_string_length(value: str, field_name: str, min_length: int = 0, max_length: Optional[int] = None) -> None:
    """
    Validate string length
    
    Args:
        value: The string value to validate
        field_name: The name of the field
        min_length: Minimum length (default: 0)
        max_length: Maximum length (optional)
        
    Raises:
        ValidationError: If the string length is invalid
    """
    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be a string", field_name, value)
    
    if len(value) < min_length:
        raise ValidationError(f"{field_name} must be at least {min_length} characters long", field_name, value)
    
    if max_length and len(value) > max_length:
        raise ValidationError(f"{field_name} must be no more than {max_length} characters long", field_name, value)


def validate_email(email: str) -> None:
    """
    Validate email format
    
    Args:
        email: The email to validate
        
    Raises:
        ValidationError: If the email format is invalid
    """
    import re
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValidationError("Invalid email format", "email", email)


def validate_phone_number(phone: str) -> None:
    """
    Validate phone number format
    
    Args:
        phone: The phone number to validate
        
    Raises:
        ValidationError: If the phone number format is invalid
    """
    import re
    
    # Basic phone number validation (can be enhanced based on requirements)
    phone_pattern = r'^[\+]?[1-9][\d]{0,15}$'
    if not re.match(phone_pattern, phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')):
        raise ValidationError("Invalid phone number format", "phone", phone)
