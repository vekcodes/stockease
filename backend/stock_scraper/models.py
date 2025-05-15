from django.db import models
from django.contrib.auth.models import User

class StockOHLC(models.Model):
    symbol = models.CharField(max_length=20)
    date = models.DateField()
    open = models.FloatField()
    high = models.FloatField()
    low = models.FloatField()
    close = models.FloatField()
    percent = models.FloatField()
    volume = models.BigIntegerField()

    class Meta:
        ordering = ['-date']
        unique_together = ['symbol', 'date']

    def __str__(self):
        return f"{self.symbol} - {self.date}"

class Investment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investments')
    stock = models.ForeignKey(StockOHLC, on_delete=models.CASCADE, related_name='investments')
    buy_price = models.FloatField()
    buy_date = models.DateField()
    sell_price = models.FloatField(null=True, blank=True)
    sell_date = models.DateField(null=True, blank=True)
    total_pl = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-buy_date']

    def __str__(self):
        return f"{self.stock.symbol} - {self.buy_date}"

    def calculate_pl(self):
        if self.sell_price and self.buy_price:
            self.total_pl = (self.sell_price - self.buy_price)
            self.save()
