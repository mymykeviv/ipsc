"""
Currency and exchange rate management utilities
"""
from decimal import Decimal
from typing import Dict, Optional
import requests
from datetime import datetime, timedelta
import json
import os
import logging

logger = logging.getLogger(__name__)

# Currency symbols mapping with fallbacks
CURRENCY_SYMBOLS = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NZD': 'NZ$',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RUB': '₽',
    'TRY': '₺',
    'BRL': 'R$',
    'MXN': '$',
    'ZAR': 'R',
    'KRW': '₩',
    'THB': '฿',
    'MYR': 'RM',
    'IDR': 'Rp',
    'PHP': '₱',
    'VND': '₫',
    'BDT': '৳',
    'PKR': '₨',
    'LKR': 'Rs',
    'NPR': '₨',
    'MMK': 'K',
    'KHR': '៛',
    'LAK': '₭',
    'MNT': '₮',
    'KZT': '₸',
    'UZS': 'so\'m',
    'TJS': 'ЅM',
    'TMT': 'T',
    'GEL': '₾',
    'AMD': '֏',
    'AZN': '₼',
    'BYN': 'Br',
    'MDL': 'L',
    'RON': 'lei',
    'BGN': 'лв',
    'HRK': 'kn',
    'RSD': 'дин',
    'BAM': 'KM',
    'MKD': 'ден',
    'ALL': 'L',
    'ISK': 'kr',
    'UAH': '₴',
    'GHS': 'GH₵',
    'NGN': '₦',
    'KES': 'KSh',
    'UGX': 'USh',
    'TZS': 'TSh',
    'ETB': 'Br',
    'EGP': 'E£',
    'MAD': 'MAD',
    'TND': 'TND',
    'DZD': 'DA',
    'LYD': 'LD',
    'SDG': 'SDG',
    'SSP': 'SSP',
    'SOS': 'S',
    'DJF': 'Fdj',
    'KMF': 'CF',
    'MUR': '₨',
    'SCR': '₨',
    'SZL': 'L',
    'LSL': 'L',
    'NAD': 'N$',
    'BWP': 'P',
    'ZMW': 'ZK',
    'MWK': 'MK',
    'ZWL': 'Z$',
    'BIF': 'FBu',
    'RWF': 'FRw',
    'CDF': 'FC',
    'GMD': 'D',
    'GNF': 'FG',
    'LRD': 'L$',
    'SLL': 'Le',
    'STD': 'Db',
    'CVE': '$',
    'GIP': '£',
    'FKP': '£',
    'SHP': '£',
    'JEP': '£',
    'GGP': '£',
    'IMP': '£',
    'BMD': '$',
    'KYD': '$',
    'BBD': '$',
    'TTD': '$',
    'XCD': '$',
    'ANG': 'ƒ',
    'AWG': 'ƒ',
    'SRD': '$',
    'GYD': '$',
    'CLP': '$',
    'COP': '$',
    'PEN': 'S/',
    'UYU': '$U',
    'ARS': '$',
    'PYG': '₲',
    'BOB': 'Bs',
    'ECU': '$',
    'VEF': 'Bs',
    'VES': 'Bs',
    'GTQ': 'Q',
    'HNL': 'L',
    'NIO': 'C$',
    'CRC': '₡',
    'PAB': 'B/.',
    'DOP': 'RD$',
    'JMD': '$',
    'HTG': 'G',
    'BZD': '$',
    'SVC': '$',
    'XPF': '₣',
    'TOP': 'T$',
    'WST': 'T',
    'FJD': '$',
    'VUV': 'Vt',
    'PGK': 'K',
    'SBD': '$',
    'KID': '$',
    'TVD': '$',
    'NIO': 'C$',
    'CRC': '₡',
    'PAB': 'B/.',
    'DOP': 'RD$',
    'JMD': '$',
    'HTG': 'G',
    'BZD': '$',
    'SVC': '$',
    'XPF': '₣',
    'TOP': 'T$',
    'WST': 'T',
    'FJD': '$',
    'VUV': 'Vt',
    'PGK': 'K',
    'SBD': '$',
    'KID': '$',
    'TVD': '$',
}

def get_currency_symbol(currency_code: str) -> str:
    """
    Get currency symbol for a given currency code.
    Returns the currency code as fallback if symbol is not available.
    
    Args:
        currency_code: Three-letter currency code (e.g., 'INR', 'USD')
        
    Returns:
        Currency symbol or currency code as fallback
    """
    if not currency_code:
        return 'INR'  # Default fallback
    
    currency_code = currency_code.upper()
    
    # Try to get the symbol
    symbol = CURRENCY_SYMBOLS.get(currency_code)
    
    if symbol:
        return symbol
    else:
        # Fallback to currency code
        logger.warning(f"Currency symbol not found for {currency_code}, using currency code as fallback")
        return currency_code

def format_currency_for_pdf(amount: float, currency_code: str = 'INR') -> str:
    """
    Format currency amount for PDF generation with proper symbol and fallback.
    
    Args:
        amount: The amount to format
        currency_code: Three-letter currency code (e.g., 'INR', 'USD')
        
    Returns:
        Formatted currency string with symbol or currency code
    """
    try:
        symbol = get_currency_symbol(currency_code)
        formatted_amount = f"{float(amount):.2f}"
        
        # For INR, use Indian number formatting (lakhs, crores)
        if currency_code.upper() == 'INR':
            # Use ₹ symbol with Unicode font support
            if amount >= 10000000:  # 1 crore
                return f"{symbol}{amount/10000000:.2f} Cr"
            elif amount >= 100000:  # 1 lakh
                return f"{symbol}{amount/100000:.2f} L"
            else:
                return f"{symbol}{formatted_amount}"
        else:
            # For other currencies, use standard formatting
            return f"{symbol}{formatted_amount}"
            
    except (ValueError, TypeError) as e:
        logger.error(f"Error formatting currency {amount} for {currency_code}: {e}")
        # Ultimate fallback
        return f"{currency_code} {amount:.2f}"

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


def get_exchange_rate(from_currency: str, to_currency: str = 'INR') -> Optional[float]:
    """
    Get exchange rate between currencies.
    This is a placeholder - in production, you'd use a real exchange rate API.
    """
    # For now, return 1.0 for same currency or common conversions
    if from_currency == to_currency:
        return 1.0
    
    # Common exchange rates (hardcoded for demo - use real API in production)
    rates = {
        'USD': 83.0,  # 1 USD = 83 INR (approximate)
        'EUR': 90.0,  # 1 EUR = 90 INR (approximate)
        'GBP': 105.0, # 1 GBP = 105 INR (approximate)
        'JPY': 0.55,  # 1 JPY = 0.55 INR (approximate)
        'CAD': 61.0,  # 1 CAD = 61 INR (approximate)
        'AUD': 54.0,  # 1 AUD = 54 INR (approximate)
    }
    
    if from_currency in rates:
        return rates[from_currency]
    
    # If not found, try reverse conversion
    if to_currency in rates:
        return 1.0 / rates[to_currency]
    
    logger.warning(f"Exchange rate not found for {from_currency} to {to_currency}")
    return None


def convert_amount(amount: Decimal, from_currency: str, to_currency: str = 'INR') -> Decimal:
    """Convert amount from one currency to another"""
    return currency_manager.convert_amount(amount, from_currency, to_currency)


def format_currency(amount: float, currency_code: str = 'INR', locale: str = 'en-IN') -> str:
    """
    Format currency for display in the UI.
    This function is used for frontend display.
    """
    try:
        import locale as locale_module
        locale_module.setlocale(locale_module.LC_ALL, locale)
        
        symbol = get_currency_symbol(currency_code)
        
        if currency_code.upper() == 'INR':
            # Use Indian number formatting
            return f"{symbol}{amount:,.2f}"
        else:
            # Use standard formatting
            return f"{symbol}{amount:,.2f}"
            
    except Exception as e:
        logger.error(f"Error formatting currency {amount} for {currency_code}: {e}")
        # Fallback
        return f"{currency_code} {amount:.2f}"


def get_supported_currencies() -> list[str]:
    """
    Get list of supported currency codes.
    """
    return list(CURRENCY_SYMBOLS.keys())


def is_supported_currency(currency: str) -> bool:
    """Check if currency is supported"""
    return currency_manager.is_supported_currency(currency)
