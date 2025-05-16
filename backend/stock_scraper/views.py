# views.py
from django.http import JsonResponse
from stock_scraper.models import StockOHLC, Investment
import pandas as pd
import numpy as np
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Max
from datetime import datetime
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

def get_stock_symbols(request):
    # Get unique symbols from StockOHLC
    symbols = StockOHLC.objects.values_list('symbol', flat=True).distinct().order_by('symbol')
    return JsonResponse({"symbols": list(symbols)}, safe=False)

def calculate_rsi(prices, period=14):
    """
    Calculate Relative Strength Index (RSI)
    """
    deltas = np.diff(prices)
    seed = deltas[:period+1]
    up = seed[seed >= 0].sum()/period
    down = -seed[seed < 0].sum()/period
    rs = up/down
    rsi = np.zeros_like(prices)
    rsi[:period] = 100. - 100./(1. + rs)

    for i in range(period, len(prices)):
        delta = deltas[i - 1]
        if delta > 0:
            upval = delta
            downval = 0.
        else:
            upval = 0.
            downval = -delta

        up = (up * (period - 1) + upval) / period
        down = (down * (period - 1) + downval) / period
        rs = up/down
        rsi[i] = 100. - 100./(1. + rs)

    return rsi

def calculate_ma(prices, window):
    """
    Calculate Moving Average manually
    """
    ma = np.zeros_like(prices)
    for i in range(len(prices)):
        if i < window - 1:
            ma[i] = np.nan
        else:
            ma[i] = np.mean(prices[i-window+1:i+1])
    return ma

def calculate_ema(prices, window):
    """
    Calculate Exponential Moving Average
    """
    ema = np.zeros_like(prices)
    multiplier = 2 / (window + 1)
    
    # Initialize EMA with SMA
    ema[window-1] = np.mean(prices[:window])
    
    # Calculate EMA
    for i in range(window, len(prices)):
        ema[i] = (prices[i] - ema[i-1]) * multiplier + ema[i-1]
    
    return ema


def golden_cross_momentum(request, symbol):
    # Step 1: Query stock data from the database for the given symbol
    ohlc_queryset = StockOHLC.objects.filter(symbol=symbol).order_by('date')

    # Step 2: Convert queryset to DataFrame
    if not ohlc_queryset.exists():
        return JsonResponse({"error": "No data found for the given symbol."}, status=404)

    df = pd.DataFrame.from_records(
        ohlc_queryset.values('date', 'close')
    )
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)

    # Step 3: Calculate indicators
    close_prices = df['close'].values
    df['MA50'] = calculate_ma(close_prices, 50)
    df['MA200'] = calculate_ma(close_prices, 200)
    df['RSI'] = calculate_rsi(close_prices)

    # Step 4: Generate signals
    df['Signal'] = 0
    
    # Generate signals based on Golden Cross and RSI
    for i in range(200, len(df)):
        # Check for Golden Cross (MA50 crosses above MA200)
        golden_cross = (df['MA50'].iloc[i-1] <= df['MA200'].iloc[i-1]) and (df['MA50'].iloc[i] > df['MA200'].iloc[i])
        
        # Check RSI momentum
        rsi_momentum = df['RSI'].iloc[i] > 50
        
        # Generate signal
        if golden_cross and rsi_momentum:
            df['Signal'].iloc[i] = 1  # Buy signal
        elif df['MA50'].iloc[i] < df['MA200'].iloc[i]:
            df['Signal'].iloc[i] = -1  # Sell signal

    df['Position'] = df['Signal'].diff()

    # Step 5: Prepare result - return last 200 days of data for better visualization
    # Include RSI in the visualization data
    result = df.dropna().tail(200)[['close', 'MA50', 'MA200', 'RSI', 'Signal', 'Position']].reset_index()
    
    # Format the data for visualization
    data = result.to_dict(orient='records')
    
    # Add metadata about the indicators
    metadata = {
        "indicators": {
            "RSI": {
                "name": "Relative Strength Index",
                "description": "Momentum indicator showing overbought (>70) and oversold (<30) conditions",
                "thresholds": {
                    "overbought": 70,
                    "oversold": 30,
                    "neutral": 50
                }
            },
            "MA50": {
                "name": "50-day Moving Average",
                "description": "Short-term trend indicator"
            },
            "MA200": {
                "name": "200-day Moving Average",
                "description": "Long-term trend indicator"
            }
        }
    }

    return JsonResponse({
        "data": data,
        "metadata": metadata
    }, safe=False)

def ma_crossover_strategy(request, symbol):
    # Step 1: Query stock data from the database for the given symbol
    # Get at least 500 days of data to ensure we have enough for MA calculations
    ohlc_queryset = StockOHLC.objects.filter(symbol=symbol).order_by('date')

    # Step 2: Convert queryset to DataFrame
    if not ohlc_queryset.exists():
        return JsonResponse({"error": "No data found for the given symbol."}, status=404)

    df = pd.DataFrame.from_records(
        ohlc_queryset.values('date', 'close')
    )
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)

    # Step 3: Calculate all MAs and EMAs
    close_prices = df['close'].values
    
    # Simple Moving Averages
    df['MA50'] = calculate_ma(close_prices, 50)
    df['MA200'] = calculate_ma(close_prices, 200)
    
    # Exponential Moving Averages
    df['EMA9'] = calculate_ema(close_prices, 9)
    df['EMA21'] = calculate_ema(close_prices, 21)
    df['EMA20'] = calculate_ema(close_prices, 20)
    df['EMA50'] = calculate_ema(close_prices, 50)

    # Step 4: Generate signals for each strategy
    strategies = {
        'golden_cross': {
            'name': 'Golden Cross (50/200 MA)',
            'type': 'Long-term Trend',
            'short_ma': 'MA50',
            'long_ma': 'MA200'
        },
        'ema_short': {
            'name': 'Short-term EMA (9/21)',
            'type': 'Short-term Trend',
            'short_ma': 'EMA9',
            'long_ma': 'EMA21'
        },
        'ema_medium': {
            'name': 'Medium-term EMA (20/50)',
            'type': 'Medium-term Trend',
            'short_ma': 'EMA20',
            'long_ma': 'EMA50'
        }
    }

    # Generate signals for each strategy
    for strategy_key, strategy in strategies.items():
        df[f'{strategy_key}_signal'] = 0
        short_ma = strategy['short_ma']
        long_ma = strategy['long_ma']
        
        # Generate signals based on crossover and price movement
        for i in range(1, len(df)):
            if pd.notna(df[short_ma].iloc[i]) and pd.notna(df[long_ma].iloc[i]):
                # Calculate price change
                price_change = df['close'].iloc[i] - df['close'].iloc[i-1]
                
                # Buy signal: short MA crosses above long MA AND price is moving up
                if (df[short_ma].iloc[i-1] <= df[long_ma].iloc[i-1]) and \
                   (df[short_ma].iloc[i] > df[long_ma].iloc[i]) and \
                   (price_change > 0):
                    df[f'{strategy_key}_signal'].iloc[i] = 1
                
                # Sell signal: short MA crosses below long MA AND price is moving down
                elif (df[short_ma].iloc[i-1] >= df[long_ma].iloc[i-1]) and \
                     (df[short_ma].iloc[i] < df[long_ma].iloc[i]) and \
                     (price_change < 0):
                    df[f'{strategy_key}_signal'].iloc[i] = -1

    # Step 5: Prepare result - return more historical data for better signal analysis
    # For Golden Cross (200 MA), we need at least 200 days of data
    # For other strategies, we'll return 300 days to ensure enough signals
    result = df.dropna().tail(300).reset_index()
    
    # Format the data for visualization
    data = result.to_dict(orient='records')
    
    # Add metadata about the strategies
    metadata = {
        "strategies": strategies
    }

    return JsonResponse({
        "data": data,
        "metadata": metadata
    }, safe=False)

def calculate_volatility(symbol, current_date, lookback_days=30):
    """
    Calculate volatility using standard deviation of returns
    """
    try:
        # Get historical data for the lookback period
        historical_data = StockOHLC.objects.filter(
            symbol=symbol,
            date__lte=current_date
        ).order_by('-date')[:lookback_days]
        
        if len(historical_data) < 2:
            return None
            
        # Convert to list and reverse to get chronological order
        prices = [float(data.close) for data in historical_data]
        prices.reverse()
        
        # Calculate daily returns using log returns
        returns = []
        for i in range(1, len(prices)):
            if prices[i-1] > 0:  # Avoid division by zero
                log_return = np.log(prices[i] / prices[i-1])
                returns.append(log_return)
        
        if not returns:
            return None
            
        # Calculate standard deviation of returns
        returns_array = np.array(returns)
        volatility = np.std(returns_array, ddof=1)  # ddof=1 for sample standard deviation
        
        # Annualize the volatility (multiply by sqrt of trading days)
        annualized_volatility = volatility * np.sqrt(252)
        
        # Convert to percentage
        volatility_percentage = annualized_volatility * 100
        
        return volatility_percentage
    except Exception as e:
        print(f"Error calculating volatility for {symbol}: {str(e)}")
        return None

def get_stocks_data(request):
    try:
        print("Starting get_stocks_data function")  # Debug log
        
        # Get the latest date for each symbol from StockOHLC
        latest_dates = StockOHLC.objects.values('symbol').annotate(
            latest_date=Max('date')
        ).values_list('symbol', 'latest_date')
        
        # Get the latest OHLC data for each symbol using a more precise query
        latest_stocks = []
        for symbol, latest_date in latest_dates:
            stock = StockOHLC.objects.filter(
                symbol=symbol,
                date=latest_date
            ).first()
            if stock:
                latest_stocks.append(stock)
        
        print(f"Found {len(latest_stocks)} stocks")  # Debug log
        
        stocks_data = []
        for stock in latest_stocks:
            try:
                # Get the previous day's data for calculating change
                previous_day = StockOHLC.objects.filter(
                    symbol=stock.symbol,
                    date__lt=stock.date
                ).order_by('-date').first()
                
                # Calculate volatility
                volatility = calculate_volatility(stock.symbol, stock.date)
                
                stock_data = {
                    'symbol': stock.symbol,
                    'close': float(stock.close) if stock.close else None,
                    'previous_close': float(previous_day.close) if previous_day else None,
                    'volume': stock.volume,
                    'volatility': volatility,
                    'date': stock.date.strftime('%Y-%m-%d') if stock.date else None
                }
                stocks_data.append(stock_data)
            except Exception as e:
                print(f"Error processing stock {stock.symbol}: {str(e)}")  # Debug log
                continue
        
        print(f"Successfully processed {len(stocks_data)} stocks")  # Debug log
        return JsonResponse({
            'stocks': stocks_data,
            'count': len(stocks_data)
        })
    except Exception as e:
        import traceback
        print(f"Error in get_stocks_data: {str(e)}")  # Debug log
        print(f"Traceback: {traceback.format_exc()}")  # Debug log
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_investments(request):
    try:
        investments = Investment.objects.filter(user=request.user).select_related('stock')
        investments_data = []
        
        for investment in investments:
            investment_data = {
                'id': investment.id,
                'stock': {
                    'symbol': investment.stock.symbol,
                },
                'buy_price': investment.buy_price,
                'quantity': investment.quantity,
                'buy_date': investment.buy_date.strftime('%Y-%m-%d') if investment.buy_date else None,
                'sell_price': investment.sell_price,
                'sell_date': investment.sell_date.strftime('%Y-%m-%d') if investment.sell_date else None,
                'total_pl': investment.total_pl
            }
            investments_data.append(investment_data)
        
        return Response(investments_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_investment(request):
    try:
        print("=== Starting add_investment ===")
        print(f"Request data: {request.data}")
        print(f"User: {request.user.id}")
        
        # Validate required fields
        required_fields = ['stock', 'buy_price', 'quantity', 'buy_date']
        for field in required_fields:
            if field not in request.data:
                print(f"Missing required field: {field}")
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Try to get the stock
        stock_symbol = request.data['stock']
        print(f"Looking for stock with symbol: {stock_symbol}")
        
        try:
            stock = StockOHLC.objects.filter(symbol=stock_symbol).order_by('-date').first()
            print(f"Stock query result: {stock}")
        except Exception as e:
            print(f"Error querying stock: {str(e)}")
            return Response({'error': f'Error querying stock: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        if not stock:
            print(f"Stock not found: {stock_symbol}")
            return Response({
                'error': f'Stock with symbol {stock_symbol} not found. Please ensure the stock exists in the database.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate buy_price is a positive number
        try:
            buy_price = float(request.data['buy_price'])
            print(f"Buy price: {buy_price}")
            if buy_price <= 0:
                print(f"Invalid buy price: {buy_price}")
                return Response({'error': 'Buy price must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError) as e:
            print(f"Error converting buy price: {str(e)}")
            return Response({'error': 'Invalid buy price'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate quantity is a positive integer
        try:
            quantity = int(request.data.get('quantity', 1))
            print(f"Quantity: {quantity}")
            if quantity <= 0:
                print(f"Invalid quantity: {quantity}")
                return Response({'error': 'Quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError) as e:
            print(f"Error converting quantity: {str(e)}")
            return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate buy_date
        try:
            buy_date = datetime.strptime(request.data['buy_date'], '%Y-%m-%d')
            print(f"Buy date: {buy_date}")
        except Exception as e:
            print(f"Error with buy date: {str(e)}")
            return Response({'error': 'Invalid buy date format. Please use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create the investment
        try:
            print("Creating investment...")
            investment = Investment.objects.create(
                user=request.user,
                stock=stock,
                buy_price=buy_price,
                quantity=quantity,
                buy_date=buy_date
            )
            print(f"Successfully created investment: {investment.id}")
        except Exception as e:
            print(f"Error creating investment: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return Response({'error': f'Error creating investment: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        response_data = {
            'user_id': request.user.id,
            'stock': {
                'symbol': request.data['stock'],
            },
            'buy_price': investment.buy_price,
            'quantity': investment.quantity,
            'buy_date': investment.buy_date.strftime('%Y-%m-%d') if investment.buy_date else None,
            'sell_price': None,
            'sell_date': None,
            'total_pl': None
        }
        print(f"Response data: {response_data}")
        return Response(response_data)
        
    except Exception as e:
        print(f"Unexpected error in add_investment: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_investment(request, investment_id):
    try:
        # Validate investment_id
        if not investment_id or investment_id == 'undefined':
            return Response({'error': 'Invalid investment ID'}, status=status.HTTP_400_BAD_REQUEST)

        investment = Investment.objects.get(id=investment_id, user=request.user)
        
        # Convert sell_date string to datetime if provided
        if 'sell_date' in request.data:
            try:
                sell_date = datetime.strptime(request.data['sell_date'], '%Y-%m-%d')
                investment.sell_date = sell_date
            except Exception as e:
                return Response({'error': 'Invalid sell date format. Please use YYYY-MM-DD'}, 
                              status=status.HTTP_400_BAD_REQUEST)

        # Update sell_price if provided
        if 'sell_price' in request.data:
            try:
                sell_price = float(request.data['sell_price'])
                if sell_price <= 0:
                    return Response({'error': 'Sell price must be greater than 0'}, 
                                  status=status.HTTP_400_BAD_REQUEST)
                investment.sell_price = sell_price
            except (ValueError, TypeError):
                return Response({'error': 'Invalid sell price'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
        investment.calculate_pl()
        investment.save()
        
        return Response({
            'id': investment.id,
            'stock': {
                'symbol': investment.stock.symbol,
            },
            'buy_price': investment.buy_price,
            'quantity': investment.quantity,
            'buy_date': investment.buy_date.strftime('%Y-%m-%d') if investment.buy_date else None,
            'sell_price': investment.sell_price,
            'sell_date': investment.sell_date.strftime('%Y-%m-%d') if investment.sell_date else None,
            'total_pl': investment.total_pl
        })
    except Investment.DoesNotExist:
        return Response({'error': 'Investment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error updating investment: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






