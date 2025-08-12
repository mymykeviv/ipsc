import json
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from .models import AuditTrail, User
from fastapi import Request


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        user: User,
        action: str,
        table_name: str,
        record_id: Optional[int] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> None:
        """Log an audit trail entry"""
        try:
            # Get client IP and user agent
            ip_address = None
            user_agent = None
            
            if request:
                # Get real IP (considering proxies)
                ip_address = request.headers.get("X-Forwarded-For", request.client.host)
                user_agent = request.headers.get("User-Agent")
            
            # Convert values to JSON strings
            old_values_json = json.dumps(old_values) if old_values else None
            new_values_json = json.dumps(new_values) if new_values else None
            
            audit_entry = AuditTrail(
                user_id=user.id,
                action=action,
                table_name=table_name,
                record_id=record_id,
                old_values=old_values_json,
                new_values=new_values_json,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            db.add(audit_entry)
            db.commit()
        except Exception as e:
            # Don't let audit failures break the main functionality
            print(f"Audit logging failed: {e}")
            db.rollback()
    
    @staticmethod
    def log_login(db: Session, user: User, request: Optional[Request] = None) -> None:
        """Log user login"""
        AuditService.log_action(
            db=db,
            user=user,
            action="LOGIN",
            table_name="users",
            record_id=user.id,
            request=request
        )
    
    @staticmethod
    def log_logout(db: Session, user: User, request: Optional[Request] = None) -> None:
        """Log user logout"""
        AuditService.log_action(
            db=db,
            user=user,
            action="LOGOUT",
            table_name="users",
            record_id=user.id,
            request=request
        )
    
    @staticmethod
    def log_create(
        db: Session,
        user: User,
        table_name: str,
        record_id: int,
        new_values: Dict[str, Any],
        request: Optional[Request] = None
    ) -> None:
        """Log record creation"""
        AuditService.log_action(
            db=db,
            user=user,
            action="CREATE",
            table_name=table_name,
            record_id=record_id,
            new_values=new_values,
            request=request
        )
    
    @staticmethod
    def log_update(
        db: Session,
        user: User,
        table_name: str,
        record_id: int,
        old_values: Dict[str, Any],
        new_values: Dict[str, Any],
        request: Optional[Request] = None
    ) -> None:
        """Log record update"""
        AuditService.log_action(
            db=db,
            user=user,
            action="UPDATE",
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            request=request
        )
    
    @staticmethod
    def log_delete(
        db: Session,
        user: User,
        table_name: str,
        record_id: int,
        old_values: Dict[str, Any],
        request: Optional[Request] = None
    ) -> None:
        """Log record deletion"""
        AuditService.log_action(
            db=db,
            user=user,
            action="DELETE",
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            request=request
        )
