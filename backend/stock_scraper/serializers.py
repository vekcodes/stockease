from rest_framework import serializers
from .models import StockOHLC

class StockOHLCSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockOHLC
        fields = '__all__'



