import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import User, Group, Message, GroupMembership
import logging 

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return

        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'chat_{self.group_id}'

        # Check if user is member of the group
        is_member = await self.is_group_member()
        if not is_member:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Update user online status
        await self.update_user_status(True)

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Update user offline status
        if hasattr(self, 'user') and not self.user.is_anonymous:
            await self.update_user_status(False)

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', 'chat_message')

            if message_type == 'chat_message':
                message = text_data_json['message']
                await self.save_message(message)

                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender': self.user.username,
                        'sender_id': self.user.id,
                        'timestamp': text_data_json.get('timestamp')
                    }
                )

            elif message_type == 'typing':
                # Send typing indicator to room group
                await self.channel_layer.group_send(
                    self.room_group_name,                    {
                        'type': 'typing_indicator',
                        'user': self.user.username,
                        'user_id': self.user.id,
                        'is_typing': text_data_json.get('is_typing', False)
                    }
                )

            elif message_type == 'message_status':
                # Update message status (delivered/read)
                message_id = text_data_json.get('message_id')
                status = text_data_json.get('status', 'delivered')
                await self.update_message_status(message_id, status)

        except json.JSONDecodeError:
            pass
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'An error occurred while processing your message'
            }))

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event.get('message_id'),
            'message': event.get('message'),
            'sender_info': event.get('sender_info'),
            'sender_id': event.get('sender_id'),
            'message_type': event.get('message_type', 'text'),
            'file_attachment': event.get('file_attachment'),
            'timestamp': event.get('timestamp')
        }))

    async def typing_indicator(self, event):
        # Don't send typing indicator to the sender
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user': event['user'],
                'user_id': event['user_id'],
                'is_typing': event['is_typing']
            }))

    @database_sync_to_async
    def is_group_member(self):
        try:
            group = Group.objects.get(id=self.group_id)
            return GroupMembership.objects.filter(user=self.user, group=group).exists()
        except Group.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message_content):
        try:
            group = Group.objects.get(id=self.group_id)
            message = Message.objects.create(
                group=group,
                sender=self.user,
                content=message_content,
                message_type=Message.MessageType.TEXT
            )
            return message
        except Group.DoesNotExist:
            return None

    @database_sync_to_async
    def update_user_status(self, is_online):
        try:
            self.user.is_online = is_online
            if not is_online:
                from django.utils import timezone
                self.user.last_seen = timezone.now()
            self.user.save(update_fields=['is_online', 'last_seen'])
        except Exception:
            pass

    @database_sync_to_async
    def update_message_status(self, message_id, status):
        try:
            from .models import MessageStatus
            message = Message.objects.get(id=message_id, group_id=self.group_id)
            MessageStatus.objects.update_or_create(
                message=message,
                user=self.user,
                defaults={'status': status}
            )
        except Message.DoesNotExist:
            pass


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try: # <--- Start of the debug block
            self.user = self.scope["user"]
            if self.user.is_anonymous:
                await self.close()
                return

            self.user_group_name = f'user_{self.user.id}'
            
            logging.info(f"NotificationConsumer: User {self.user.id} connecting to group {self.user_group_name}")

            # Join user notification group
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
            logging.info(f"NotificationConsumer: User {self.user.id} successfully added to group.")

            await self.accept()
            
            logging.info(f"NotificationConsumer: Connection accepted for user {self.user.id}.")

        except Exception as e: # <--- Catch the error
            # Log the exception to the console.
            logging.exception(f"NotificationConsumer: FAILED to connect for user {self.scope.get('user')}")
            # Explicitly close the connection on failure
            await self.close()

    async def disconnect(self, close_code):
        # Leave user notification group
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        # Handle any notification-related messages if needed
        pass

    async def new_message_notification(self, event):
        # Send new message notification
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'group_id': event['group_id'],
            'group_name': event['group_name'],
            'sender': event['sender'],
            'message': event['message']
        }))

    async def user_status_update(self, event):
        # Send user status update
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online']
        }))