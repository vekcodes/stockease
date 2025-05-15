from django.core.management.base import BaseCommand
from stock_scraper.models import Stock, StockOHLC
from django.db.models import Max
import numpy as np

class Command(BaseCommand):
    help = 'Update Stock model with latest data from StockOHLC'

    def handle(self, *args, **kwargs):
        # Get all unique symbols
        symbols = StockOHLC.objects.values_list('symbol', flat=True).distinct()
        
        for symbol in symbols:
            # Get the latest OHLC data for this symbol
            latest_ohlc = StockOHLC.objects.filter(symbol=symbol).order_by('-date').first()
            if not latest_ohlc:
                continue
                
            # Get the previous day's close
            previous_ohlc = StockOHLC.objects.filter(
                symbol=symbol,
                date__lt=latest_ohlc.date
            ).order_by('-date').first()
            
            # Calculate volatility (standard deviation of last 20 days' returns)
            last_20_days = StockOHLC.objects.filter(
                symbol=symbol,
                date__lte=latest_ohlc.date
            ).order_by('-date')[:20]
            
            if len(last_20_days) >= 2:
                returns = []
                for i in range(len(last_20_days)-1):
                    returns.append((last_20_days[i].close - last_20_days[i+1].close) / last_20_days[i+1].close)
                volatility = np.std(returns) * 100  # Convert to percentage
            else:
                volatility = 0
            
            # Create or update Stock record
            stock, created = Stock.objects.update_or_create(
                symbol=symbol,
                defaults={
                    'name': symbol,  # You might want to add a mapping for full company names
                    'close': latest_ohlc.close,
                    'volume': latest_ohlc.volume,
                    'date': latest_ohlc.date,
                    'previous_close': previous_ohlc.close if previous_ohlc else None,
                    'volatility': volatility
                }
            )
            
            if created:
                self.stdout.write(f"Created new stock record for {symbol}")
            else:
                self.stdout.write(f"Updated stock record for {symbol}")
        
        self.stdout.write(self.style.SUCCESS("✅ Stock data updated successfully.")) 