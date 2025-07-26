from rest_framework import generics, status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, AdminLoginSerializer, UserSerializer, AdminUserCreateSerializer
from .models import Admin
from stock_scraper.models import StockOHLC
import pandas as pd
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class AdminLoginView(generics.GenericAPIView):
    serializer_class = AdminLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            # Check if user exists and is admin
            try:
                user = User.objects.get(username=username)
                admin = Admin.objects.get(user=user)
            except (User.DoesNotExist, Admin.DoesNotExist):
                return Response({'error': 'Invalid admin credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Authenticate user
            user = authenticate(username=username, password=password)
            if user is None:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'is_admin': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Check if user is admin
        try:
            admin = Admin.objects.get(user=self.request.user)
            return User.objects.filter(is_superuser=False).exclude(id=self.request.user.id)
        except Admin.DoesNotExist:
            return User.objects.none()


class AdminUserCreateView(generics.CreateAPIView):
    serializer_class = AdminUserCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Check if user is admin
        try:
            admin = Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        return super().create(request, *args, **kwargs)


class AdminUserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def destroy(self, request, *args, **kwargs):
        # Check if user is admin
        try:
            admin = Admin.objects.get(user=request.user)
        except Admin.DoesNotExist:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        if user.is_superuser:
            return Response({'error': 'Cannot delete superuser'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.delete()
        return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_seed_stocks(request):
    # Check if user is admin
    try:
        admin = Admin.objects.get(user=request.user)
    except Admin.DoesNotExist:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    if 'csv_file' not in request.FILES:
        return Response({'error': 'CSV file is required'}, status=status.HTTP_400_BAD_REQUEST)

    csv_file = request.FILES['csv_file']
    stock_title = request.data.get('stock_title', '')

    if not stock_title:
        return Response({'error': 'Stock title is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        import pandas as pd
        from stock_scraper.models import StockOHLC
        df = pd.read_csv(csv_file)
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
            'volume': 'volume'
        }
        df = df.rename(columns=column_mapping)
        required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({'error': f'Missing columns: {missing_columns}'}, status=status.HTTP_400_BAD_REQUEST)
        symbol = stock_title.lower()
        # Delete all existing records for this symbol
        deleted_count, _ = StockOHLC.objects.filter(symbol=symbol).delete()
        records_created = 0
        errors = []
        attempted = 0
        for idx, row in df.iterrows():
            attempted += 1
            try:
                # Clean volume field
                volume_str = str(row['volume']).replace(',', '').strip()
                volume_val = int(float(volume_str)) if volume_str else 0

                date_value = row['date']
                if isinstance(date_value, str):
                    try:
                        parsed_date = pd.to_datetime(date_value, format='%m/%d/%Y').date()
                    except:
                        parsed_date = pd.to_datetime(date_value).date()
                else:
                    parsed_date = pd.to_datetime(date_value).date()
                StockOHLC.objects.create(
                    symbol=symbol,
                    date=parsed_date,
                    open=float(row['open']),
                    high=float(row['high']),
                    low=float(row['low']),
                    close=float(row['close']),
                    volume=volume_val,
                    percent=0.0
                )
                records_created += 1
            except Exception as e:
                error_msg = f'Row {idx}: {str(e)} | Data: {row.to_dict()}'
                print(error_msg)
                errors.append(error_msg)
                continue
        if attempted == 0:
            return Response({'error': 'No rows found in CSV.'}, status=status.HTTP_400_BAD_REQUEST)
        if records_created == 0:
            return Response({
                'error': f'No new records added for {symbol}. All rows failed to insert.',
                'deleted_count': deleted_count,
                'errors': errors
            }, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'message': f'Successfully deleted {deleted_count} old records and added {records_created} new records for {symbol}.',
            'deleted_count': deleted_count,
            'records_created': records_created,
            'errors': errors
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        import traceback
        print(f'Fatal error in admin_seed_stocks: {str(e)}')
        print(traceback.format_exc())
        return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

