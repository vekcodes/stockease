from django.db import models
from django.contrib.auth.models import User

class Stock(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    symbol = models.CharField(max_length=10)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()
    purchase_date = models.DateField()
    script_type = models.CharField(max_length=50, choices=[
        ('equity', 'Equity'),
        ('mutual_fund', 'Mutual Fund'),
        ('etf', 'ETF'),
        ('bond', 'Bond'),
    ])

    def __str__(self):
        return f"{self.name} ({self.symbol})"