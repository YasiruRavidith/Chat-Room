import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import User, Group, Message, GroupMembership, MessageStatus
import logging 
from .serializers import MessageSerializer
from django.utils import timezone 

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return

        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'chat_{self.group_id}'

        is_member = await self.is_group_member()
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # This line was causing the error. It will now work.
        await self.update_user_status(True)

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and not self.user.is_anonymous:
            # This line also needs the method to exist.
            await self.update_user_status(False)

        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'typing')

            if message_type == 'typing':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'user': self.user.username,
                        'user_id': self.user.id,
                        'is_typing': data.get('is_typing', False)
                    }
                )
        except Exception as e:
            logging.error(f"Error in ChatConsumer receive: {e}")
    # This method is called by the broadcast from views.py
    async def chat_message(self, event):
        message_data = event['message_data']
        await self.send(text_data=json.dumps(message_data))

    # Handle message status updates (read/delivered status changes)
    async def message_status_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def typing_indicator(self, event):
        if event.get('user_id') != self.user.id:
            await self.send(text_data=json.dumps(event))

    # --- DATABASE HELPER METHODS ---

    @database_sync_to_async
    def is_group_member(self):
        return Group.objects.filter(id=self.group_id, members=self.user).exists()

    # --- THIS IS THE MISSING METHOD ---
    # Add this method to the ChatConsumer class.
    @database_sync_to_async
    def update_user_status(self, is_online):
        if self.user.is_authenticated:
            self.user.is_online = is_online
            if not is_online:
                self.user.last_seen = timezone.now()
            self.user.save(update_fields=['is_online', 'last_seen'])


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
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                # Handle marking messages as read
                group_id = data.get('group_id')
                if group_id:
                    await self.mark_messages_as_read(group_id)
            elif message_type == 'get_unread_count':
                # Send back unread message count
                unread_count = await self.get_unread_count()
                await self.send(text_data=json.dumps({
                    'type': 'unread_count',
                    'count': unread_count
                }))
        except json.JSONDecodeError:
            logging.error("Invalid JSON received in NotificationConsumer")
        except Exception as e:
            logging.error(f"Error in NotificationConsumer receive: {e}")

    async def new_message_notification(self, event):
        # Send new message notification
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'group_id': event['group_id'],
            'group_name': event['group_name'],
            'sender': event['sender'],
            'message': event['message']
        }))

    @database_sync_to_async
    def update_user_status(self, is_online):
        if self.user.is_authenticated:
            self.user.is_online = is_online
            if not is_online:
                self.user.last_seen = timezone.now()
            self.user.save(update_fields=['is_online', 'last_seen'])