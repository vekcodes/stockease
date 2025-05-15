from django.db import models

class StockOHLC(models.Model):
    symbol = models.CharField(max_length=20)
    date = models.DateField()
    open = models.FloatField()
    high = models.FloatField()
    low = models.FloatField()
    close = models.FloatField()
    percent = models.FloatField()
    volume = models.BigIntegerField()

    def __str__(self):
        return f"{self.symbol} - {self.date}"
