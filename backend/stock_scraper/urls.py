from django.urls import path
from . import views

urlpatterns = [
    path('symbols/', views.get_stock_symbols, name='get_stock_symbols'),
    path('strategy/<str:symbol>/', views.golden_cross_momentum, name='golden_cross_momentum'),
    path('ma_crossover/<str:symbol>/', views.ma_crossover_strategy, name='ma_crossover_strategy'),
    path('stocks/', views.get_stocks_data, name='get_stocks_data'),
    path('investments/', views.get_investments, name='get_investments'),
    path('investments/add/', views.add_investment, name='add_investment'),
    path('investments/<int:investment_id>/', views.update_investment, name='update_investment'),
]
