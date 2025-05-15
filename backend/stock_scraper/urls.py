from django.urls import path
from . import views

urlpatterns = [
    path('symbols/', views.get_stock_symbols, name='get_stock_symbols'),
    path('strategy/<str:symbol>/', views.golden_cross_momentum, name='golden_cross_momentum'),
    path('ma_crossover/<str:symbol>/', views.ma_crossover_strategy, name='ma_crossover_strategy'),
]
