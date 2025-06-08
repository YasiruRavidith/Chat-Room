from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken, AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
import urllib.parse

User = get_user_model()


@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Parse the query string to get the token
        query_string = scope['query_string'].decode()
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            try:
                # Try to validate and decode token using AccessToken
                access_token = AccessToken(token)
                user_id = access_token.get('user_id')
                
                if user_id:
                    scope['user'] = await get_user(user_id)
                    print(f"✅ WebSocket authenticated user: {scope['user'].username}")
                else:
                    print("❌ No user_id in token")
                    scope['user'] = AnonymousUser()
                    
            except (InvalidToken, TokenError) as e:
                print(f"❌ JWT Auth Error: {e}")
                # Try manual token decode as fallback
                try:
                    decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                    user_id = decoded_data.get('user_id')
                    if user_id:
                        scope['user'] = await get_user(user_id)
                        print(f"✅ WebSocket authenticated user (fallback): {scope['user'].username}")
                    else:
                        scope['user'] = AnonymousUser()
                except Exception as fallback_error:
                    print(f"❌ Fallback decode failed: {fallback_error}")
                    scope['user'] = AnonymousUser()
            except Exception as e:
                print(f"❌ Unexpected error in JWT middleware: {e}")
                scope['user'] = AnonymousUser()
        else:
            print("❌ No token provided in WebSocket connection")
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)

# Client-side JavaScript code to connect WebSocket with token
# const token = "your_generated_token_here";
# const ws = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);