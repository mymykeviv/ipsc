"""
Currency and exchange rate management utilities
"""
from decimal import Decimal
from typing import Dict, Optional
import requests
from datetime import datetime, timedelta
import json
import os


class CurrencyManager:
    """Manages currency exchange rates and conversions"""
    
    # Supported currencies with their symbols
    SUPPORTED_CURRENCIES = {
        'INR': {'symbol': '₹', 'name': 'Indian Rupee'},
        'USD': {'symbol': '$', 'name': 'US Dollar'},
        'EUR': {'symbol': '€', 'name': 'Euro'},
        'GBP': {'symbol': '£', 'name': 'British Pound'},
        'CAD': {'symbol': 'C$', 'name': 'Canadian Dollar'},
        'AUD': {'symbol': 'A$', 'name': 'Australian Dollar'},
        'JPY': {'symbol': '¥', 'name': 'Japanese Yen'},
        'CHF': {'symbol': 'CHF', 'name': 'Swiss Franc'},
        'SGD': {'symbol': 'S$', 'name': 'Singapore Dollar'},
        'AED': {'symbol': 'AED', 'name': 'UAE Dirham'},
    }
    
    def __init__(self):
        self.exchange_rates: Dict[str, float] = {}
        self.last_updated: Optional[datetime] = None
        self.cache_duration = timedelta(hours=1)  # Cache rates for 1 hour
    
    def get_supported_currencies(self) -> Dict[str, Dict[str, str]]:
        """Get list of supported currencies"""
        return self.SUPPORTED_CURRENCIES.copy()
    
    def is_supported_currency(self, currency: str) -> bool:
        """Check if currency is supported"""
        return currency.upper() in self.SUPPORTED_CURRENCIES
    
    def get_exchange_rate(self, from_currency: str, to_currency: str = 'INR') -> float:
        """
        Get exchange rate from one currency to another
        Default target currency is INR
        """
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        
        # Same currency
        if from_currency == to_currency:
            return 1.0
        
        # Check cache
        cache_key = f"{from_currency}_{to_currency}"
        if (cache_key in self.exchange_rates and 
            self.last_updated and 
            datetime.now() - self.last_updated < self.cache_duration):
            return self.exchange_rates[cache_key]
        
        # Fetch from API
        try:
            rate = self._fetch_exchange_rate(from_currency, to_currency)
            self.exchange_rates[cache_key] = rate
            self.last_updated = datetime.now()
            return rate
        except Exception as e:
            # Fallback to default rates for common currencies
            return self._get_fallback_rate(from_currency, to_currency)
    
    def _fetch_exchange_rate(self, from_currency: str, to_currency: str) -> float:
        """
        Fetch exchange rate from external API
        Using a free API for demonstration - in production, use a paid service
        """
        try:
            # Using exchangerate-api.com (free tier)
            url = f"https://api.exchangerate-api.com/v4/latest/{from_currency}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            rates = data.get('rates', {})
            
            if to_currency in rates:
                return float(rates[to_currency])
            else:
                raise ValueError(f"Exchange rate not available for {to_currency}")
                
        except Exception as e:
            print(f"Error fetching exchange rate: {e}")
            raise
    
    def _get_fallback_rate(self, from_currency: str, to_currency: str) -> float:
        """Get fallback exchange rates for common currencies"""
        # These are approximate rates - in production, use a reliable source
        fallback_rates = {
            'USD_INR': 83.0,
            'EUR_INR': 90.0,
            'GBP_INR': 105.0,
            'CAD_INR': 61.0,
            'AUD_INR': 54.0,
            'JPY_INR': 0.56,
            'CHF_INR': 95.0,
            'SGD_INR': 62.0,
            'AED_INR': 22.6,
        }
        
        cache_key = f"{from_currency}_{to_currency}"
        if cache_key in fallback_rates:
            return fallback_rates[cache_key]
        
        # Default to 1.0 if no fallback rate available
        return 1.0
    
    def convert_amount(self, amount: Decimal, from_currency: str, to_currency: str = 'INR') -> Decimal:
        """
        Convert amount from one currency to another
        Default target currency is INR
        """
        if from_currency == to_currency:
            return amount
        
        rate = self.get_exchange_rate(from_currency, to_currency)
        return amount * Decimal(str(rate))
    
    def format_currency(self, amount: Decimal, currency: str) -> str:
        """Format amount with currency symbol"""
        currency = currency.upper()
        if currency not in self.SUPPORTED_CURRENCIES:
            return f"{amount:.2f} {currency}"
        
        symbol = self.SUPPORTED_CURRENCIES[currency]['symbol']
        
        # Format based on currency
        if currency == 'INR':
            return f"₹{amount:,.2f}"
        elif currency == 'USD':
            return f"${amount:,.2f}"
        elif currency == 'EUR':
            return f"€{amount:,.2f}"
        elif currency == 'GBP':
            return f"£{amount:,.2f}"
        else:
            return f"{symbol}{amount:,.2f}"


# Global currency manager instance
currency_manager = CurrencyManager()


def get_exchange_rate(from_currency: str, to_currency: str = 'INR') -> float:
    """Get exchange rate from one currency to another"""
    return currency_manager.get_exchange_rate(from_currency, to_currency)


def convert_amount(amount: Decimal, from_currency: str, to_currency: str = 'INR') -> Decimal:
    """Convert amount from one currency to another"""
    return currency_manager.convert_amount(amount, from_currency, to_currency)


def format_currency(amount: Decimal, currency: str) -> str:
    """Format amount with currency symbol"""
    return currency_manager.format_currency(amount, currency)


def get_supported_currencies() -> Dict[str, Dict[str, str]]:
    """Get list of supported currencies"""
    return currency_manager.get_supported_currencies()


def is_supported_currency(currency: str) -> bool:
    """Check if currency is supported"""
    return currency_manager.is_supported_currency(currency)
