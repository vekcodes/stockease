import os
import pandas as pd
from django.core.management.base import BaseCommand
from stock_scraper.models import StockOHLC

class Command(BaseCommand):
    help = 'Seed stock OHLC data from CSV files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to specific CSV file to seed'
        )
        parser.add_argument(
            '--symbol',
            type=str,
            help='Stock symbol for the CSV file'
        )
        parser.add_argument(
            '--folder',
            type=str,
            default='E:/1Stockease/backend/stock_scraper/stocks',
            help='Folder path containing CSV files'
        )

    def handle(self, *args, **options):
        if options['file'] and options['symbol']:
            # Seed specific file
            self.seed_single_file(options['file'], options['symbol'])
        else:
            # Seed all files in folder
            self.seed_folder(options['folder'])

    def seed_single_file(self, file_path, symbol):
        """Seed a single CSV file with specified symbol"""
        try:
            # Read CSV file
            df = pd.read_csv(file_path)
            self.stdout.write(f"CSV loaded successfully. Columns: {list(df.columns)}")
            self.stdout.write(f"CSV has {len(df)} rows")
            
            # Define column mapping for Excel format
            column_mapping = {
                'Date': 'date',
                'date': 'date',
                'Open': 'open',
                'open': 'open',
                'High': 'high',
                'high': 'high',
                'Low': 'low',
                'low': 'low',
                'Close': 'close',
                'close': 'close',
                'Volume': 'volume',
                'volume': 'volume',
                'Turn Over': 'turnover',
                'turnover': 'turnover',
                'Percent Cl': 'percent_change',
                'percent_change': 'percent_change'
            }
            
            # Rename columns based on mapping
            df = df.rename(columns=column_mapping)
            self.stdout.write(f"After mapping. Columns: {list(df.columns)}")
            
            # Validate required columns after mapping
            required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                self.stdout.write(self.style.ERROR(f'Missing required columns after mapping: {missing_columns}. Available columns: {list(df.columns)}'))
                return
            
            # Convert symbol to lowercase
            symbol = symbol.lower()
            self.stdout.write(f"Processing symbol: {symbol}")
            
            # Get existing dates for this symbol
            existing_dates = set(StockOHLC.objects.filter(symbol=symbol).values_list('date', flat=True))
            self.stdout.write(f"Found {len(existing_dates)} existing dates for {symbol}")
            
            # Process and save data
            records_created = 0
            records_skipped = 0
            
            for index, row in df.iterrows():
                try:
                    # Handle different date formats
                    date_value = row['date']
                    
                    if isinstance(date_value, str):
                        # Try different date formats
                        try:
                            parsed_date = pd.to_datetime(date_value, format='%m/%d/%Y').date()
                        except:
                            try:
                                parsed_date = pd.to_datetime(date_value).date()
                            except:
                                self.stdout.write(f"Could not parse date: {date_value}")
                                continue
                    else:
                        parsed_date = pd.to_datetime(date_value).date()
                    
                    # Check if this date already exists
                    if parsed_date in existing_dates:
                        records_skipped += 1
                        continue
                    
                    StockOHLC.objects.create(
                        symbol=symbol,
                        date=parsed_date,
                        open=float(row['open']),
                        high=float(row['high']),
                        low=float(row['low']),
                        close=float(row['close']),
                        volume=int(row['volume']),
                        percent=0.0  # Default value
                    )
                    records_created += 1
                    
                except Exception as e:
                    self.stdout.write(f"Error processing row {index}: {str(e)}")
                    continue
            
            if records_created == 0:
                self.stdout.write(self.style.WARNING(f'No new records added for {symbol}. All dates already exist in database.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {records_created} new records for {symbol}. Skipped {records_skipped} existing records.'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing CSV file: {str(e)}'))

    def seed_folder(self, folder_path):
        """Seed all CSV files in a folder"""
        rows = []

        def clean_number(value):
            try:
                value = str(value).replace(",", "").strip()
                if value == '':
                    return 0
                return float(value) if '.' in value else int(value)
            except Exception as e:
                print(f"Error cleaning value '{value}': {e}")
                return 0

        for file in os.listdir(folder_path):
            if file.endswith('.csv'):
                symbol = os.path.splitext(file)[0]
                file_path = os.path.join(folder_path, file)

                try:
                    df = pd.read_csv(file_path)
                except Exception as e:
                    self.stdout.write(f"Error reading {file}: {e}")
                    continue

                for index, row in df.iterrows():
                    try:
                        rows.append(
                            StockOHLC(
                                symbol=symbol,
                                date=row['Date'],
                                open=clean_number(row['Open']),
                                high=clean_number(row['High']),
                                low=clean_number(row['Low']),
                                close=clean_number(row['Close']),
                                percent=clean_number(row.get('Percent', 0)),
                                volume=clean_number(row['Volume']),
                            )
                        )
                    except Exception as e:
                        self.stdout.write(f"Error processing row in {file}: {row} — {e}")

        StockOHLC.objects.bulk_create(rows, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS("✅ Stock OHLC data seeded successfully."))
