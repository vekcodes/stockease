import os
import pandas as pd
from django.core.management.base import BaseCommand
from stock_scraper.models import StockOHLC

class Command(BaseCommand):
    help = 'Seed stock OHLC data from CSV files'

    def handle(self, *args, **kwargs):
        folder_path = 'D:/1Stockease/backend/stock_scraper/stocks'  # <- adjust this to your real directory

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
                    print(f"Error reading {file}: {e}")
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
                        print(f"Error processing row in {file}: {row} — {e}")

        StockOHLC.objects.bulk_create(rows, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS("✅ Stock OHLC data seeded successfully."))
