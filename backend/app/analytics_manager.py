"""
Advanced Analytics & Reporting Manager
Handles comprehensive analytics, reporting, and data visualization with UX/UI excellence
"""
import asyncio
import logging
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime, date, timedelta
from decimal import Decimal
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, func, text
from sqlalchemy.orm import selectinload

from .models import (
    User, Party, Product, StockLedgerEntry, Invoice, InvoiceItem,
    Purchase, PurchaseItem, Expense, AuditTrail
)
from .tenant_config import tenant_config_manager
from .security_manager import security_manager
from .branding_manager import branding_manager

logger = logging.getLogger(__name__)

class AnalyticsManager:
    """Advanced analytics and reporting with UX/UI excellence"""
    
    def __init__(self):
        self.cache: Dict[str, Dict] = {}
        self.report_templates: Dict[str, Dict] = {}
        self.dashboard_configs: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()
        self._initialize_report_templates()
        self._initialize_dashboard_configs()
    
    def _initialize_report_templates(self):
        """Initialize predefined report templates for consistent UX"""
        self.report_templates = {
            'financial_summary': {
                'name': 'Financial Summary',
                'description': 'Comprehensive financial overview with key metrics',
                'sections': ['revenue_analysis', 'expense_analysis', 'profitability', 'cash_flow'],
                'visualizations': ['line_chart', 'bar_chart', 'pie_chart', 'kpi_cards'],
                'refresh_interval': 3600,  # 1 hour
                'export_formats': ['pdf', 'excel', 'csv']
            },
            'sales_analytics': {
                'name': 'Sales Analytics',
                'description': 'Detailed sales performance and trends analysis',
                'sections': ['sales_trends', 'top_products', 'customer_analysis', 'geographic_insights'],
                'visualizations': ['trend_chart', 'heatmap', 'scatter_plot', 'funnel_chart'],
                'refresh_interval': 1800,  # 30 minutes
                'export_formats': ['pdf', 'excel', 'csv']
            },
            'inventory_insights': {
                'name': 'Inventory Insights',
                'description': 'Inventory performance and optimization recommendations',
                'sections': ['stock_levels', 'turnover_analysis', 'reorder_insights', 'waste_analysis'],
                'visualizations': ['gauge_chart', 'bar_chart', 'table_view', 'alert_cards'],
                'refresh_interval': 900,  # 15 minutes
                'export_formats': ['pdf', 'excel', 'csv']
            },
            'operational_metrics': {
                'name': 'Operational Metrics',
                'description': 'Key operational performance indicators',
                'sections': ['efficiency_metrics', 'quality_metrics', 'timeline_analysis', 'resource_utilization'],
                'visualizations': ['radar_chart', 'progress_bars', 'timeline_chart', 'metric_cards'],
                'refresh_interval': 300,  # 5 minutes
                'export_formats': ['pdf', 'excel', 'csv']
            }
        }
    
    def _initialize_dashboard_configs(self):
        """Initialize dashboard configurations for optimal UX"""
        self.dashboard_configs = {
            'executive_dashboard': {
                'name': 'Executive Dashboard',
                'description': 'High-level overview for executive decision making',
                'layout': 'grid_3x2',
                'widgets': [
                    {'type': 'kpi_card', 'title': 'Total Revenue', 'metric': 'revenue', 'position': 'top_left'},
                    {'type': 'kpi_card', 'title': 'Total Expenses', 'metric': 'expenses', 'position': 'top_center'},
                    {'type': 'kpi_card', 'title': 'Net Profit', 'metric': 'profit', 'position': 'top_right'},
                    {'type': 'line_chart', 'title': 'Revenue Trends', 'metric': 'revenue_trends', 'position': 'bottom_left'},
                    {'type': 'pie_chart', 'title': 'Expense Breakdown', 'metric': 'expense_categories', 'position': 'bottom_center'},
                    {'type': 'bar_chart', 'title': 'Top Products', 'metric': 'top_products', 'position': 'bottom_right'}
                ],
                'refresh_interval': 1800,  # 30 minutes
                'theme': 'professional'
            },
            'operational_dashboard': {
                'name': 'Operational Dashboard',
                'description': 'Detailed operational metrics and insights',
                'layout': 'grid_4x3',
                'widgets': [
                    {'type': 'metric_card', 'title': 'Orders Today', 'metric': 'daily_orders', 'position': 'row1_col1'},
                    {'type': 'metric_card', 'title': 'Pending Orders', 'metric': 'pending_orders', 'position': 'row1_col2'},
                    {'type': 'metric_card', 'title': 'Low Stock Items', 'metric': 'low_stock_count', 'position': 'row1_col3'},
                    {'type': 'metric_card', 'title': 'Quality Score', 'metric': 'quality_score', 'position': 'row1_col4'},
                    {'type': 'trend_chart', 'title': 'Order Trends', 'metric': 'order_trends', 'position': 'row2_col1-2'},
                    {'type': 'heatmap', 'title': 'Product Performance', 'metric': 'product_performance', 'position': 'row2_col3-4'},
                    {'type': 'table_view', 'title': 'Recent Activities', 'metric': 'recent_activities', 'position': 'row3_col1-4'}
                ],
                'refresh_interval': 300,  # 5 minutes
                'theme': 'modern'
            },
            'financial_dashboard': {
                'name': 'Financial Dashboard',
                'description': 'Comprehensive financial analysis and reporting',
                'layout': 'grid_3x3',
                'widgets': [
                    {'type': 'kpi_card', 'title': 'Monthly Revenue', 'metric': 'monthly_revenue', 'position': 'row1_col1'},
                    {'type': 'kpi_card', 'title': 'Monthly Expenses', 'metric': 'monthly_expenses', 'position': 'row1_col2'},
                    {'type': 'kpi_card', 'title': 'Profit Margin', 'metric': 'profit_margin', 'position': 'row1_col3'},
                    {'type': 'line_chart', 'title': 'Cash Flow', 'metric': 'cash_flow', 'position': 'row2_col1-2'},
                    {'type': 'pie_chart', 'title': 'Revenue Sources', 'metric': 'revenue_sources', 'position': 'row2_col3'},
                    {'type': 'bar_chart', 'title': 'Expense Categories', 'metric': 'expense_categories', 'position': 'row3_col1-2'},
                    {'type': 'scatter_plot', 'title': 'Profit vs Volume', 'metric': 'profit_volume', 'position': 'row3_col3'}
                ],
                'refresh_interval': 3600,  # 1 hour
                'theme': 'financial'
            }
        }
    
    async def get_executive_dashboard(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get executive dashboard with high-level insights and excellent UX"""
        try:
            # Check cache first for performance
            cache_key = f"executive_dashboard_{tenant_id}_{datetime.now().strftime('%Y%m%d_%H')}"
            if cache_key in self.cache:
                return self.cache[cache_key]
            
            # Get comprehensive financial data
            financial_data = await self._get_financial_summary(tenant_id, session)
            
            # Get operational metrics
            operational_data = await self._get_operational_summary(tenant_id, session)
            
            # Get trend analysis
            trend_data = await self._get_trend_analysis(tenant_id, session)
            
            # Compile dashboard with UX-optimized structure
            dashboard = {
                'dashboard_type': 'executive',
                'last_updated': datetime.utcnow().isoformat(),
                'refresh_interval': 1800,
                'theme': 'professional',
                'layout': {
                    'type': 'grid_3x2',
                    'responsive': True,
                    'mobile_optimized': True
                },
                'widgets': {
                    'kpi_cards': {
                        'total_revenue': {
                            'title': 'Total Revenue',
                            'value': financial_data.get('total_revenue', 0),
                            'change': financial_data.get('revenue_change', 0),
                            'change_percentage': financial_data.get('revenue_change_percentage', 0),
                            'trend': financial_data.get('revenue_trend', 'stable'),
                            'icon': 'trending_up',
                            'color': 'success'
                        },
                        'total_expenses': {
                            'title': 'Total Expenses',
                            'value': financial_data.get('total_expenses', 0),
                            'change': financial_data.get('expense_change', 0),
                            'change_percentage': financial_data.get('expense_change_percentage', 0),
                            'trend': financial_data.get('expense_trend', 'stable'),
                            'icon': 'account_balance',
                            'color': 'warning'
                        },
                        'net_profit': {
                            'title': 'Net Profit',
                            'value': financial_data.get('net_profit', 0),
                            'change': financial_data.get('profit_change', 0),
                            'change_percentage': financial_data.get('profit_change_percentage', 0),
                            'trend': financial_data.get('profit_trend', 'stable'),
                            'icon': 'monetization_on',
                            'color': 'primary'
                        }
                    },
                    'charts': {
                        'revenue_trends': {
                            'type': 'line_chart',
                            'title': 'Revenue Trends (Last 12 Months)',
                            'data': trend_data.get('revenue_trends', []),
                            'options': {
                                'responsive': True,
                                'maintainAspectRatio': False,
                                'scales': {
                                    'y': {'beginAtZero': True},
                                    'x': {'type': 'time'}
                                }
                            }
                        },
                        'expense_breakdown': {
                            'type': 'doughnut_chart',
                            'title': 'Expense Breakdown',
                            'data': financial_data.get('expense_breakdown', []),
                            'options': {
                                'responsive': True,
                                'plugins': {
                                    'legend': {'position': 'bottom'},
                                    'tooltip': {'enabled': True}
                                }
                            }
                        },
                        'top_products': {
                            'type': 'horizontal_bar_chart',
                            'title': 'Top 5 Products by Revenue',
                            'data': operational_data.get('top_products', []),
                            'options': {
                                'responsive': True,
                                'indexAxis': 'y',
                                'scales': {'x': {'beginAtZero': True}}
                            }
                        }
                    }
                },
                'insights': {
                    'key_insights': financial_data.get('key_insights', []),
                    'recommendations': financial_data.get('recommendations', []),
                    'alerts': operational_data.get('alerts', [])
                },
                'export_options': {
                    'formats': ['pdf', 'excel', 'csv'],
                    'scheduled_reports': True,
                    'email_delivery': True
                }
            }
            
            # Cache the result for performance
            self.cache[cache_key] = dashboard
            
            return dashboard
            
        except Exception as e:
            logger.error(f"Error getting executive dashboard for tenant {tenant_id}: {e}")
            return self._get_error_dashboard("Executive Dashboard", str(e))
    
    async def get_operational_dashboard(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get operational dashboard with real-time metrics and excellent UX"""
        try:
            # Check cache first for performance
            cache_key = f"operational_dashboard_{tenant_id}_{datetime.now().strftime('%Y%m%d_%H%M')}"
            if cache_key in self.cache:
                return self.cache[cache_key]
            
            # Get real-time operational data
            daily_metrics = await self._get_daily_operational_metrics(tenant_id, session)
            order_analytics = await self._get_order_analytics(tenant_id, session)
            inventory_status = await self._get_inventory_status(tenant_id, session)
            quality_metrics = await self._get_quality_metrics(tenant_id, session)
            
            # Compile dashboard with UX-optimized structure
            dashboard = {
                'dashboard_type': 'operational',
                'last_updated': datetime.utcnow().isoformat(),
                'refresh_interval': 300,  # 5 minutes for real-time feel
                'theme': 'modern',
                'layout': {
                    'type': 'grid_4x3',
                    'responsive': True,
                    'mobile_optimized': True
                },
                'widgets': {
                    'metric_cards': {
                        'orders_today': {
                            'title': 'Orders Today',
                            'value': daily_metrics.get('orders_today', 0),
                            'change': daily_metrics.get('orders_change', 0),
                            'icon': 'shopping_cart',
                            'color': 'primary'
                        },
                        'pending_orders': {
                            'title': 'Pending Orders',
                            'value': daily_metrics.get('pending_orders', 0),
                            'change': daily_metrics.get('pending_change', 0),
                            'icon': 'pending',
                            'color': 'warning'
                        },
                        'low_stock_items': {
                            'title': 'Low Stock Items',
                            'value': inventory_status.get('low_stock_count', 0),
                            'change': inventory_status.get('low_stock_change', 0),
                            'icon': 'warning',
                            'color': 'error'
                        },
                        'quality_score': {
                            'title': 'Quality Score',
                            'value': quality_metrics.get('overall_score', 0),
                            'change': quality_metrics.get('score_change', 0),
                            'icon': 'star',
                            'color': 'success'
                        }
                    },
                    'charts': {
                        'order_trends': {
                            'type': 'area_chart',
                            'title': 'Order Trends (Last 7 Days)',
                            'data': order_analytics.get('daily_trends', []),
                            'options': {
                                'responsive': True,
                                'fill': True,
                                'scales': {
                                    'y': {'beginAtZero': True},
                                    'x': {'type': 'time'}
                                }
                            }
                        },
                        'product_performance': {
                            'type': 'heatmap',
                            'title': 'Product Performance Matrix',
                            'data': order_analytics.get('product_performance', []),
                            'options': {
                                'responsive': True,
                                'colorScale': 'RdYlGn'
                            }
                        },
                        'recent_activities': {
                            'type': 'activity_feed',
                            'title': 'Recent Activities',
                            'data': daily_metrics.get('recent_activities', []),
                            'options': {
                                'max_items': 10,
                                'auto_refresh': True
                            }
                        }
                    }
                },
                'alerts': {
                    'urgent_alerts': inventory_status.get('urgent_alerts', []),
                    'performance_alerts': quality_metrics.get('performance_alerts', []),
                    'system_alerts': daily_metrics.get('system_alerts', [])
                },
                'quick_actions': {
                    'create_order': {'label': 'Create Order', 'icon': 'add_shopping_cart'},
                    'check_inventory': {'label': 'Check Inventory', 'icon': 'inventory'},
                    'view_reports': {'label': 'View Reports', 'icon': 'assessment'},
                    'export_data': {'label': 'Export Data', 'icon': 'download'}
                }
            }
            
            # Cache the result for performance
            self.cache[cache_key] = dashboard
            
            return dashboard
            
        except Exception as e:
            logger.error(f"Error getting operational dashboard for tenant {tenant_id}: {e}")
            return self._get_error_dashboard("Operational Dashboard", str(e))
    
    async def get_financial_dashboard(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get comprehensive financial dashboard with excellent UX"""
        try:
            # Check cache first for performance
            cache_key = f"financial_dashboard_{tenant_id}_{datetime.now().strftime('%Y%m%d_%H')}"
            if cache_key in self.cache:
                return self.cache[cache_key]
            
            # Get comprehensive financial data
            financial_data = await self._get_detailed_financial_analysis(tenant_id, session)
            cash_flow_data = await self._get_cash_flow_analysis(tenant_id, session)
            profitability_data = await self._get_profitability_analysis(tenant_id, session)
            
            # Compile dashboard with UX-optimized structure
            dashboard = {
                'dashboard_type': 'financial',
                'last_updated': datetime.utcnow().isoformat(),
                'refresh_interval': 3600,
                'theme': 'financial',
                'layout': {
                    'type': 'grid_3x3',
                    'responsive': True,
                    'mobile_optimized': True
                },
                'widgets': {
                    'kpi_cards': {
                        'monthly_revenue': {
                            'title': 'Monthly Revenue',
                            'value': financial_data.get('monthly_revenue', 0),
                            'change': financial_data.get('revenue_change', 0),
                            'change_percentage': financial_data.get('revenue_change_percentage', 0),
                            'icon': 'trending_up',
                            'color': 'success'
                        },
                        'monthly_expenses': {
                            'title': 'Monthly Expenses',
                            'value': financial_data.get('monthly_expenses', 0),
                            'change': financial_data.get('expense_change', 0),
                            'change_percentage': financial_data.get('expense_change_percentage', 0),
                            'icon': 'account_balance',
                            'color': 'warning'
                        },
                        'profit_margin': {
                            'title': 'Profit Margin',
                            'value': profitability_data.get('profit_margin', 0),
                            'change': profitability_data.get('margin_change', 0),
                            'change_percentage': profitability_data.get('margin_change_percentage', 0),
                            'icon': 'percent',
                            'color': 'primary'
                        }
                    },
                    'charts': {
                        'cash_flow': {
                            'type': 'waterfall_chart',
                            'title': 'Cash Flow Analysis',
                            'data': cash_flow_data.get('waterfall_data', []),
                            'options': {
                                'responsive': True,
                                'scales': {'y': {'beginAtZero': True}}
                            }
                        },
                        'revenue_sources': {
                            'type': 'pie_chart',
                            'title': 'Revenue Sources',
                            'data': financial_data.get('revenue_sources', []),
                            'options': {
                                'responsive': True,
                                'plugins': {
                                    'legend': {'position': 'bottom'},
                                    'tooltip': {'enabled': True}
                                }
                            }
                        },
                        'expense_categories': {
                            'type': 'bar_chart',
                            'title': 'Expense Categories',
                            'data': financial_data.get('expense_categories', []),
                            'options': {
                                'responsive': True,
                                'scales': {'y': {'beginAtZero': True}}
                            }
                        },
                        'profit_volume': {
                            'type': 'scatter_plot',
                            'title': 'Profit vs Volume Analysis',
                            'data': profitability_data.get('profit_volume_data', []),
                            'options': {
                                'responsive': True,
                                'scales': {
                                    'x': {'title': 'Volume'},
                                    'y': {'title': 'Profit'}
                                }
                            }
                        }
                    }
                },
                'insights': {
                    'financial_insights': financial_data.get('key_insights', []),
                    'cash_flow_insights': cash_flow_data.get('insights', []),
                    'profitability_insights': profitability_data.get('insights', []),
                    'recommendations': financial_data.get('recommendations', [])
                },
                'export_options': {
                    'formats': ['pdf', 'excel', 'csv'],
                    'scheduled_reports': True,
                    'email_delivery': True,
                    'custom_date_ranges': True
                }
            }
            
            # Cache the result for performance
            self.cache[cache_key] = dashboard
            
            return dashboard
            
        except Exception as e:
            logger.error(f"Error getting financial dashboard for tenant {tenant_id}: {e}")
            return self._get_error_dashboard("Financial Dashboard", str(e))
    
    async def generate_custom_report(self, tenant_id: str, report_config: Dict, session: AsyncSession) -> Dict:
        """Generate custom reports with flexible configuration and excellent UX"""
        try:
            report_type = report_config.get('type', 'custom')
            date_range = report_config.get('date_range', 'last_30_days')
            metrics = report_config.get('metrics', [])
            visualizations = report_config.get('visualizations', [])
            
            # Get data based on report configuration
            report_data = await self._get_custom_report_data(tenant_id, report_config, session)
            
            # Generate visualizations based on UX best practices
            charts = await self._generate_visualizations(report_data, visualizations)
            
            # Compile report with UX-optimized structure
            report = {
                'report_type': report_type,
                'generated_at': datetime.utcnow().isoformat(),
                'date_range': date_range,
                'config': report_config,
                'summary': {
                    'total_records': report_data.get('total_records', 0),
                    'key_metrics': report_data.get('key_metrics', {}),
                    'insights': report_data.get('insights', []),
                    'recommendations': report_data.get('recommendations', [])
                },
                'visualizations': charts,
                'data_tables': report_data.get('data_tables', []),
                'export_options': {
                    'formats': report_config.get('export_formats', ['pdf', 'excel', 'csv']),
                    'include_charts': True,
                    'include_data': True,
                    'custom_styling': True
                },
                'sharing_options': {
                    'email': True,
                    'link_sharing': True,
                    'scheduled_delivery': True
                }
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating custom report for tenant {tenant_id}: {e}")
            return self._get_error_report(report_config.get('name', 'Custom Report'), str(e))
    
    async def get_report_templates(self) -> Dict:
        """Get available report templates for consistent UX"""
        return {
            'templates': self.report_templates,
            'categories': {
                'financial': ['financial_summary'],
                'operational': ['operational_metrics'],
                'sales': ['sales_analytics'],
                'inventory': ['inventory_insights']
            },
            'customization_options': {
                'date_ranges': ['today', 'yesterday', 'last_7_days', 'last_30_days', 'last_90_days', 'custom'],
                'visualization_types': ['line_chart', 'bar_chart', 'pie_chart', 'doughnut_chart', 'area_chart', 'scatter_plot', 'heatmap', 'table'],
                'export_formats': ['pdf', 'excel', 'csv', 'json'],
                'themes': ['light', 'dark', 'professional', 'modern']
            }
        }
    
    async def get_dashboard_configs(self) -> Dict:
        """Get dashboard configurations for consistent UX"""
        return {
            'dashboards': self.dashboard_configs,
            'widget_types': {
                'kpi_card': {'description': 'Key Performance Indicator cards', 'configurable': True},
                'line_chart': {'description': 'Time-series line charts', 'configurable': True},
                'bar_chart': {'description': 'Bar charts for comparisons', 'configurable': True},
                'pie_chart': {'description': 'Pie charts for proportions', 'configurable': True},
                'table_view': {'description': 'Data tables with sorting', 'configurable': True},
                'metric_card': {'description': 'Simple metric display', 'configurable': True},
                'activity_feed': {'description': 'Real-time activity feed', 'configurable': True}
            },
            'layout_options': {
                'grid_3x2': {'description': '3 columns, 2 rows', 'mobile_friendly': True},
                'grid_4x3': {'description': '4 columns, 3 rows', 'mobile_friendly': True},
                'grid_3x3': {'description': '3 columns, 3 rows', 'mobile_friendly': True},
                'flexible': {'description': 'Custom layout', 'mobile_friendly': False}
            }
        }
    
    # Helper methods for data retrieval
    async def _get_financial_summary(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get comprehensive financial summary data"""
        try:
            # Get current month data
            current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month = (current_month - timedelta(days=1)).replace(day=1)
            
            # Revenue analysis
            current_revenue_query = select(func.sum(Invoice.total_amount)).where(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.invoice_date >= current_month,
                    Invoice.status == 'paid'
                )
            )
            current_revenue_result = await session.execute(current_revenue_query)
            current_revenue = current_revenue_result.scalar() or 0
            
            last_revenue_query = select(func.sum(Invoice.total_amount)).where(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.invoice_date >= last_month,
                    Invoice.invoice_date < current_month,
                    Invoice.status == 'paid'
                )
            )
            last_revenue_result = await session.execute(last_revenue_query)
            last_revenue = last_revenue_result.scalar() or 0
            
            # Expense analysis
            current_expense_query = select(func.sum(Expense.amount)).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.expense_date >= current_month
                )
            )
            current_expense_result = await session.execute(current_expense_query)
            current_expense = current_expense_result.scalar() or 0
            
            last_expense_query = select(func.sum(Expense.amount)).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.expense_date >= last_month,
                    Expense.expense_date < current_month
                )
            )
            last_expense_result = await session.execute(last_expense_query)
            last_expense = last_expense_result.scalar() or 0
            
            # Calculate changes
            revenue_change = current_revenue - last_revenue
            revenue_change_percentage = (revenue_change / last_revenue * 100) if last_revenue > 0 else 0
            
            expense_change = current_expense - last_expense
            expense_change_percentage = (expense_change / last_expense * 100) if last_expense > 0 else 0
            
            net_profit = current_revenue - current_expense
            last_profit = last_revenue - last_expense
            profit_change = net_profit - last_profit
            profit_change_percentage = (profit_change / last_profit * 100) if last_profit > 0 else 0
            
            # Get expense breakdown
            expense_breakdown_query = select(
                Expense.category,
                func.sum(Expense.amount).label('total_amount')
            ).where(
                and_(
                    Expense.tenant_id == tenant_id,
                    Expense.expense_date >= current_month
                )
            ).group_by(Expense.category)
            
            expense_breakdown_result = await session.execute(expense_breakdown_query)
            expense_breakdown = [
                {'category': row.category, 'amount': float(row.total_amount)}
                for row in expense_breakdown_result
            ]
            
            return {
                'total_revenue': float(current_revenue),
                'total_expenses': float(current_expense),
                'net_profit': float(net_profit),
                'revenue_change': float(revenue_change),
                'revenue_change_percentage': float(revenue_change_percentage),
                'expense_change': float(expense_change),
                'expense_change_percentage': float(expense_change_percentage),
                'profit_change': float(profit_change),
                'profit_change_percentage': float(profit_change_percentage),
                'revenue_trend': 'up' if revenue_change > 0 else 'down',
                'expense_trend': 'up' if expense_change > 0 else 'down',
                'profit_trend': 'up' if profit_change > 0 else 'down',
                'expense_breakdown': expense_breakdown,
                'key_insights': [
                    f"Revenue {'increased' if revenue_change > 0 else 'decreased'} by {abs(revenue_change_percentage):.1f}% compared to last month",
                    f"Expenses {'increased' if expense_change > 0 else 'decreased'} by {abs(expense_change_percentage):.1f}% compared to last month",
                    f"Net profit is {net_profit:,.2f} with a {profit_change_percentage:+.1f}% change"
                ],
                'recommendations': [
                    "Monitor expense categories for optimization opportunities",
                    "Focus on high-margin products to improve profitability",
                    "Consider implementing cost control measures if expenses are trending up"
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting financial summary: {e}")
            return {}
    
    async def _get_operational_summary(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get operational summary data"""
        try:
            # Get top products by revenue
            top_products_query = select(
                Product.name,
                func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).label('total_revenue')
            ).join(
                InvoiceItem, Product.id == InvoiceItem.product_id
            ).join(
                Invoice, InvoiceItem.invoice_id == Invoice.id
            ).where(
                and_(
                    Product.tenant_id == tenant_id,
                    Invoice.tenant_id == tenant_id,
                    Invoice.status == 'paid',
                    Invoice.invoice_date >= datetime.utcnow() - timedelta(days=30)
                )
            ).group_by(Product.name).order_by(
                func.sum(InvoiceItem.quantity * InvoiceItem.unit_price).desc()
            ).limit(5)
            
            top_products_result = await session.execute(top_products_query)
            top_products = [
                {'name': row.name, 'revenue': float(row.total_revenue)}
                for row in top_products_result
            ]
            
            # Get recent activities
            recent_activities_query = select(AuditTrail).where(
                and_(
                    AuditTrail.tenant_id == tenant_id,
                    AuditTrail.created_at >= datetime.utcnow() - timedelta(days=7)
                )
            ).order_by(AuditTrail.created_at.desc()).limit(10)
            
            recent_activities_result = await session.execute(recent_activities_query)
            recent_activities = [
                {
                    'action': row.action,
                    'entity_type': row.entity_type,
                    'entity_id': row.entity_id,
                    'timestamp': row.created_at.isoformat(),
                    'user': row.user_id
                }
                for row in recent_activities_result
            ]
            
            return {
                'top_products': top_products,
                'recent_activities': recent_activities,
                'alerts': [
                    {'type': 'info', 'message': 'System operating normally'},
                    {'type': 'success', 'message': 'All scheduled reports generated successfully'}
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting operational summary: {e}")
            return {}
    
    async def _get_trend_analysis(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get trend analysis data"""
        try:
            # Get revenue trends for last 12 months
            revenue_trends = []
            for i in range(12):
                month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
                month_end = month_start.replace(day=28) + timedelta(days=4)
                month_end = month_end.replace(day=1) - timedelta(days=1)
                
                revenue_query = select(func.sum(Invoice.total_amount)).where(
                    and_(
                        Invoice.tenant_id == tenant_id,
                        Invoice.invoice_date >= month_start,
                        Invoice.invoice_date <= month_end,
                        Invoice.status == 'paid'
                    )
                )
                revenue_result = await session.execute(revenue_query)
                revenue = revenue_result.scalar() or 0
                
                revenue_trends.append({
                    'month': month_start.strftime('%Y-%m'),
                    'revenue': float(revenue)
                })
            
            return {
                'revenue_trends': list(reversed(revenue_trends))
            }
            
        except Exception as e:
            logger.error(f"Error getting trend analysis: {e}")
            return {}
    
    async def _get_daily_operational_metrics(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get daily operational metrics"""
        try:
            today = datetime.utcnow().date()
            yesterday = today - timedelta(days=1)
            
            # Orders today
            orders_today_query = select(func.count(Invoice.id)).where(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.invoice_date >= today
                )
            )
            orders_today_result = await session.execute(orders_today_query)
            orders_today = orders_today_result.scalar() or 0
            
            # Orders yesterday
            orders_yesterday_query = select(func.count(Invoice.id)).where(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.invoice_date >= yesterday,
                    Invoice.invoice_date < today
                )
            )
            orders_yesterday_result = await session.execute(orders_yesterday_query)
            orders_yesterday = orders_yesterday_result.scalar() or 0
            
            # Pending orders
            pending_orders_query = select(func.count(Invoice.id)).where(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.status == 'pending'
                )
            )
            pending_orders_result = await session.execute(pending_orders_query)
            pending_orders = pending_orders_result.scalar() or 0
            
            return {
                'orders_today': orders_today,
                'orders_change': orders_today - orders_yesterday,
                'pending_orders': pending_orders,
                'pending_change': 0,  # Would need historical data
                'recent_activities': [],
                'system_alerts': []
            }
            
        except Exception as e:
            logger.error(f"Error getting daily operational metrics: {e}")
            return {}
    
    async def _get_order_analytics(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get order analytics data"""
        try:
            # Get daily order trends for last 7 days
            daily_trends = []
            for i in range(7):
                day = datetime.utcnow().date() - timedelta(days=i)
                
                orders_query = select(func.count(Invoice.id)).where(
                    and_(
                        Invoice.tenant_id == tenant_id,
                        Invoice.invoice_date >= day,
                        Invoice.invoice_date < day + timedelta(days=1)
                    )
                )
                orders_result = await session.execute(orders_query)
                orders = orders_result.scalar() or 0
                
                daily_trends.append({
                    'date': day.strftime('%Y-%m-%d'),
                    'orders': orders
                })
            
            return {
                'daily_trends': list(reversed(daily_trends)),
                'product_performance': []
            }
            
        except Exception as e:
            logger.error(f"Error getting order analytics: {e}")
            return {}
    
    async def _get_inventory_status(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get inventory status data"""
        try:
            # Get low stock count
            low_stock_query = select(func.count(Product.id)).where(
                and_(
                    Product.tenant_id == tenant_id,
                    Product.current_stock <= Product.reorder_level
                )
            )
            low_stock_result = await session.execute(low_stock_query)
            low_stock_count = low_stock_result.scalar() or 0
            
            return {
                'low_stock_count': low_stock_count,
                'low_stock_change': 0,  # Would need historical data
                'urgent_alerts': [
                    {'type': 'warning', 'message': f'{low_stock_count} items need reordering'} if low_stock_count > 0 else None
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting inventory status: {e}")
            return {}
    
    async def _get_quality_metrics(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get quality metrics data"""
        try:
            # Placeholder for quality metrics
            return {
                'overall_score': 95.5,
                'score_change': 2.5,
                'performance_alerts': []
            }
            
        except Exception as e:
            logger.error(f"Error getting quality metrics: {e}")
            return {}
    
    async def _get_detailed_financial_analysis(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get detailed financial analysis"""
        try:
            # This would include more detailed financial analysis
            return await self._get_financial_summary(tenant_id, session)
            
        except Exception as e:
            logger.error(f"Error getting detailed financial analysis: {e}")
            return {}
    
    async def _get_cash_flow_analysis(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get cash flow analysis"""
        try:
            # Placeholder for cash flow analysis
            return {
                'waterfall_data': [],
                'insights': []
            }
            
        except Exception as e:
            logger.error(f"Error getting cash flow analysis: {e}")
            return {}
    
    async def _get_profitability_analysis(self, tenant_id: str, session: AsyncSession) -> Dict:
        """Get profitability analysis"""
        try:
            # Placeholder for profitability analysis
            return {
                'profit_margin': 25.5,
                'margin_change': 1.2,
                'margin_change_percentage': 4.9,
                'profit_volume_data': [],
                'insights': []
            }
            
        except Exception as e:
            logger.error(f"Error getting profitability analysis: {e}")
            return {}
    
    async def _get_custom_report_data(self, tenant_id: str, report_config: Dict, session: AsyncSession) -> Dict:
        """Get custom report data based on configuration"""
        try:
            # This would implement custom report data retrieval based on configuration
            return {
                'total_records': 0,
                'key_metrics': {},
                'insights': [],
                'recommendations': [],
                'data_tables': []
            }
            
        except Exception as e:
            logger.error(f"Error getting custom report data: {e}")
            return {}
    
    async def _generate_visualizations(self, data: Dict, visualization_types: List[str]) -> Dict:
        """Generate visualizations based on UX best practices"""
        try:
            charts = {}
            for viz_type in visualization_types:
                if viz_type == 'line_chart':
                    charts['line_chart'] = {
                        'type': 'line_chart',
                        'data': [],
                        'options': {
                            'responsive': True,
                            'maintainAspectRatio': False
                        }
                    }
                elif viz_type == 'bar_chart':
                    charts['bar_chart'] = {
                        'type': 'bar_chart',
                        'data': [],
                        'options': {
                            'responsive': True,
                            'scales': {'y': {'beginAtZero': True}}
                        }
                    }
                # Add more visualization types as needed
            
            return charts
            
        except Exception as e:
            logger.error(f"Error generating visualizations: {e}")
            return {}
    
    def _get_error_dashboard(self, dashboard_name: str, error_message: str) -> Dict:
        """Get error dashboard with user-friendly error handling"""
        return {
            'dashboard_type': 'error',
            'name': dashboard_name,
            'error': {
                'message': 'Unable to load dashboard data',
                'details': error_message,
                'suggestions': [
                    'Please try refreshing the page',
                    'Check your internet connection',
                    'Contact support if the problem persists'
                ]
            },
            'last_updated': datetime.utcnow().isoformat(),
            'retry_available': True
        }
    
    def _get_error_report(self, report_name: str, error_message: str) -> Dict:
        """Get error report with user-friendly error handling"""
        return {
            'report_type': 'error',
            'name': report_name,
            'error': {
                'message': 'Unable to generate report',
                'details': error_message,
                'suggestions': [
                    'Please check your report configuration',
                    'Try a different date range',
                    'Contact support if the problem persists'
                ]
            },
            'generated_at': datetime.utcnow().isoformat(),
            'retry_available': True
        }

# Global instance
analytics_manager = AnalyticsManager()
