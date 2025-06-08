from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


class Command(BaseCommand):
    help = 'Test WebSocket functionality and generate test tokens'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username to generate token for',
            default='admin'
        )

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            token = AccessToken.for_user(user)
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ User found: {user.username} (ID: {user.id})')
            )
            self.stdout.write(
                self.style.SUCCESS(f'🔑 JWT Token: {str(token)}')
            )
            self.stdout.write(
                self.style.WARNING('📋 Copy this token and use it in your WebSocket connection:')
            )
            self.stdout.write(
                f'ws://127.0.0.1:8000/ws/notifications/?token={str(token)}'
            )
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ User "{username}" not found.')
            )
            self.stdout.write(
                self.style.WARNING('Available users:')
            )
            for user in User.objects.all()[:5]:
                self.stdout.write(f'  - {user.username}')
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error: {e}')
            )