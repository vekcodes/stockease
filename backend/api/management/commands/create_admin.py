from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Admin

class Command(BaseCommand):
    help = 'Create admin user with specified credentials'

    def handle(self, *args, **kwargs):
        username = 'admin@12'
        password = 'Adminlogin@112'
        email = 'admin@stockease.com'
        
        # Check if admin user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'Admin user "{username}" already exists'))
            return
        
        # Create admin user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name='Admin',
            last_name='User'
        )
        
        # Create admin record
        admin = Admin.objects.create(user=user)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created admin user "{username}"')
        ) 