# filepath: main/views.py

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Max
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction
from .serializers import (
    UserSerializer, UserSearchSerializer, GroupSerializer, 
    MessageSerializer, GroupMembershipSerializer, BlockedUserSerializer
)
from .models import User, Group, Message, GroupMembership, BlockedUser, MessageStatus, AIConfiguration
from .ai_service import send_ai_response
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import os
import logging

logger = logging.getLogger(__name__)

# User views

class UserCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        # Handle PATCH requests with both multipart and JSON data
        return self.partial_update(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        # Handle PUT requests with both multipart and JSON data
        user = self.get_object()
          # Handle AI configuration fields
        if 'ai_temperature' in request.data or 'ai_max_tokens' in request.data:
            # Get or create AI configuration
            ai_config, created = AIConfiguration.objects.get_or_create(
                is_active=True,
                defaults={
                    'model_name': 'gemini-1.5-flash',
                    'api_key': 'AIzaSyCRtLRbJjbKgYDgCJzosRrF7nBbu5nd1RY',
                    'max_tokens': 1000,
                    'temperature': 0.7
                }
            )
            
            # Update AI configuration
            if 'ai_temperature' in request.data:
                ai_config.temperature = float(request.data['ai_temperature'])
            if 'ai_max_tokens' in request.data:
                ai_config.max_tokens = int(request.data['ai_max_tokens'])
            ai_config.save()
            
            # Update user's offline mode settings
            if 'offline_mode_enabled' in request.data:
                user.offline_mode_enabled = request.data['offline_mode_enabled']
            if 'offline_ai_message' in request.data:
                user.offline_ai_message = request.data['offline_ai_message']
            user.save()
            
            # Return success response
            return Response({
                'message': 'AI configuration updated successfully',
                'offline_mode_enabled': user.offline_mode_enabled,
                'offline_ai_message': user.offline_ai_message,
                'ai_temperature': ai_config.temperature,
                'ai_max_tokens': ai_config.max_tokens
            })
        
        return self.update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        # Delete profile picture file when user is deleted
        if instance.profile_picture:
            if os.path.isfile(instance.profile_picture.path):
                os.remove(instance.profile_picture.path)
        instance.delete()


class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        profile_picture_url = None
        if user.profile_picture:
            profile_picture_url = request.build_absolute_uri(user.profile_picture.url)
        
        # Get AI configuration
        ai_config = AIConfiguration.objects.filter(is_active=True).first()
        
        return Response({
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "profile_picture": profile_picture_url,
            "is_online": user.is_online,
            "offline_mode_enabled": user.offline_mode_enabled,
            "offline_ai_message": user.offline_ai_message,
            "ai_temperature": ai_config.temperature if ai_config else 0.7,
            "ai_max_tokens": ai_config.max_tokens if ai_config else 1000
        })


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search_term = request.GET.get('q', '').strip()
        if not search_term:
            return Response({"users": []})

        # Exclude blocked users
        blocked_user_ids = BlockedUser.objects.filter(
            Q(blocker=request.user) | Q(blocked=request.user)
        ).values_list('blocked_id', 'blocker_id')
        blocked_ids = set()
        for blocked_id, blocker_id in blocked_user_ids:
            blocked_ids.add(blocked_id)
            blocked_ids.add(blocker_id)

        users = User.objects.filter(
            Q(username__icontains=search_term) | Q(name__icontains=search_term)
        ).exclude(id__in=blocked_ids).exclude(id=request.user.id)[:20]

        serializer = UserSearchSerializer(users, many=True, context={'request': request})
        return Response({"users": serializer.data})


class UpdateOnlineStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        is_online = request.data.get('is_online', False)
        user = request.user
        user.is_online = is_online
        if not is_online:
            user.last_seen = timezone.now()
        user.save()
        return Response({"status": "updated"})


# Group and Chat views

class GroupListCreateView(generics.ListCreateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Group.objects.filter(members=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        with transaction.atomic():
            group = serializer.save(created_by=self.request.user)

            # Use .getlist() to correctly retrieve all member IDs from multipart/form-data
            member_ids = self.request.data.getlist('members', [])
            
            # The rest of the logic correctly adds all members, including the creator
            members_to_add = {self.request.user}
            
            if member_ids:
                # Sanitize IDs and fetch user objects
                clean_member_ids = {int(pk) for pk in member_ids if str(pk).isdigit()}
                clean_member_ids.discard(self.request.user.id)
                
                if clean_member_ids:
                    other_users = User.objects.filter(id__in=clean_member_ids)
                    members_to_add.update(other_users)

            # Prepare GroupMembership objects for bulk creation
            memberships = []
            for user_obj in members_to_add:
                role = GroupMembership.Role.OWNER if user_obj.id == self.request.user.id else GroupMembership.Role.MEMBER
                memberships.append(GroupMembership(user=user_obj, group=group, role=role))

            # Create all memberships in a single database query
            if memberships:
                GroupMembership.objects.bulk_create(memberships)


class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Group.objects.filter(members=self.request.user)


class CreatePrivateChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get('user_id')
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if users are blocked
        if BlockedUser.objects.filter(
            Q(blocker=request.user, blocked=other_user) |
            Q(blocker=other_user, blocked=request.user)
        ).exists():
            return Response({"error": "Cannot create chat with blocked user"}, 
                          status=status.HTTP_403_FORBIDDEN)

        # Check if private chat already exists
        existing_chat = Group.objects.filter(
            group_type=Group.GroupType.PRIVATE,
            members=request.user
        ).filter(members=other_user).first()

        if existing_chat:
            serializer = GroupSerializer(existing_chat, context={'request': request})
            return Response(serializer.data)

        # Create new private chat
        group = Group.objects.create(
            group_type=Group.GroupType.PRIVATE,
            created_by=request.user
        )
        
        # Add both users as members
        GroupMembership.objects.create(user=request.user, group=group)
        GroupMembership.objects.create(user=other_user, group=group)

        serializer = GroupSerializer(group, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GroupMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id, members=request.user)
        except Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        memberships = GroupMembership.objects.filter(group=group)
        serializer = GroupMembershipSerializer(memberships, many=True, context={'request': request})
        return Response({"members": serializer.data})

    def post(self, request, group_id):
        # Add member to group
        try:
            group = Group.objects.get(id=group_id)
            membership = GroupMembership.objects.get(user=request.user, group=group)
            if membership.role not in [GroupMembership.Role.ADMIN, GroupMembership.Role.OWNER]:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        except (Group.DoesNotExist, GroupMembership.DoesNotExist):
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            GroupMembership.objects.get_or_create(user=user, group=group)
            return Response({"status": "Member added"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class LeaveGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            membership = GroupMembership.objects.get(user=request.user, group=group)
            membership.delete()
            return Response({"status": "Left group"})
        except (Group.DoesNotExist, GroupMembership.DoesNotExist):
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)


# Message views

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        group_id = self.kwargs.get('group_id')
        try:
            # Ensure the user is a member before allowing them to see messages.
            Group.objects.get(id=group_id, members=self.request.user)
            return Message.objects.filter(group_id=group_id, is_deleted=False).order_by('created_at')
        except Group.DoesNotExist:
            return Message.objects.none()

    def perform_create(self, serializer):
        group_id = self.kwargs.get('group_id')
        group = Group.objects.get(id=group_id, members=self.request.user)

        file_attachment = self.request.FILES.get('file_attachment')
        message_type = Message.MessageType.TEXT
        if file_attachment:
            if file_attachment.content_type.startswith('image/'):
                message_type = Message.MessageType.IMAGE
            else:
                message_type = Message.MessageType.FILE
        
        # Save the message instance to the database
        message = serializer.save(
            sender=self.request.user,
            group=group,
            message_type=message_type,
            file_name=file_attachment.name if file_attachment else '',
            file_size=file_attachment.size if file_attachment else None
        )
        group.save()

        # --- BROADCAST LOGIC STARTS HERE ---
        try:
            channel_layer = get_channel_layer()
            room_group_name = f'chat_{group_id}'
            
            # Re-serialize the message to get all computed fields (like file_url)
            message_data = MessageSerializer(message, context={'request': self.request}).data
            
            # The event dictionary to be broadcast.
            # The 'type' key tells the consumer which method to call.
            event = {
                'type': 'chat_message', # This MUST match the method name in the consumer
                'message_data': message_data # Pass the full serialized message
            }
            
            async_to_sync(channel_layer.group_send)(room_group_name, event)
            logger.info(f"Broadcasted message {message.id} to group {room_group_name}")
        except Exception as e:
            logger.error(f"Failed to broadcast message via WebSocket for group {group_id}: {e}")
          # --- Handle AI response for offline users ---
        if group.group_type == Group.GroupType.PRIVATE:
            other_member = group.members.exclude(id=self.request.user.id).first()
            if other_member and not other_member.is_online and other_member.offline_mode_enabled:
                # Add a small delay to ensure the user's message is fully processed first
                from threading import Timer
                timer = Timer(1.0, lambda: send_ai_response(group, other_member, message.content))
                timer.start()

class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            sender=self.request.user,
            group__members=self.request.user
        )

    def perform_destroy(self, instance):
        # Soft delete - mark as deleted instead of actually deleting
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()

        # Delete file attachment if exists
        if instance.file_attachment:
            if os.path.isfile(instance.file_attachment.path):
                os.remove(instance.file_attachment.path)


class MessageStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id, group__members=request.user)
        except Message.DoesNotExist:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status', 'delivered')
        MessageStatus.objects.update_or_create(
            message=message,
            user=request.user,
            defaults={'status': status_value}
        )
        
        return Response({"status": "updated"})


class MarkMessagesReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        from django.db import transaction
        
        try:
            group = Group.objects.get(id=group_id, members=request.user)
        except Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get all messages in the group not sent by the current user
        messages_to_mark = Message.objects.filter(group=group).exclude(sender=request.user)

        if not messages_to_mark.exists():
            return Response({"status": "No messages to mark as read", "count": 0})

        try:
            # Use a single atomic transaction to perform all updates.
            with transaction.atomic():
                # Loop through messages and update or create their status.
                # This is more resilient to locking than bulk operations in some cases.
                for message in messages_to_mark:
                    MessageStatus.objects.update_or_create(
                        message=message,
                        user=request.user,
                        defaults={'status': 'read'}
                    )
            
            return Response({"status": "Messages marked as read", "count": messages_to_mark.count()})

        except Exception as e:
            # If the transaction fails (e.g., due to a persistent lock), return an error.
            print(f"Error marking messages as read: {e}")
            return Response(
                {"error": "Could not mark messages as read. The service is busy. Please try again shortly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

# Blocking functionality

class BlockedUsersListView(generics.ListAPIView):
    serializer_class = BlockedUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BlockedUser.objects.filter(blocker=self.request.user)


class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id') or request.data.get('blocked_user_id')
        reason = request.data.get('reason', '')
        
        try:
            user_to_block = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user_to_block == request.user:
            return Response({"error": "Cannot block yourself"}, status=status.HTTP_400_BAD_REQUEST)

        blocked_user, created = BlockedUser.objects.get_or_create(
            blocker=request.user,
            blocked=user_to_block,
            defaults={'reason': reason}
        )

        if created:
            return Response({"status": "User blocked"})
        else:
            return Response({"status": "User already blocked"})


class UnblockUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        
        try:
            blocked_user = BlockedUser.objects.get(
                blocker=request.user,
                blocked_id=user_id
            )
            blocked_user.delete()
            return Response({"status": "User unblocked"})
        except BlockedUser.DoesNotExist:
            return Response({"error": "User not blocked"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, user_id=None):
        # Handle DELETE requests with user_id in URL
        if not user_id:
            user_id = request.data.get('user_id')
        
        try:
            blocked_user = BlockedUser.objects.get(
                blocker=request.user,
                blocked_id=user_id
            )
            blocked_user.delete()
            return Response({"status": "User unblocked"})
        except BlockedUser.DoesNotExist:
            return Response({"error": "User not blocked"}, status=status.HTTP_404_NOT_FOUND)


# AI Configuration view

class AIConfigurationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get current user's AI configuration
        user = request.user
        ai_config = AIConfiguration.objects.filter(is_active=True).first()
        
        return Response({
            "offline_mode_enabled": user.offline_mode_enabled,
            "offline_ai_message": user.offline_ai_message,
            "ai_temperature": ai_config.temperature if ai_config else 0.7,
            "ai_max_tokens": ai_config.max_tokens if ai_config else 1000,
            "model_name": ai_config.model_name if ai_config else "gemini-1.5-flash",
            "is_active": ai_config.is_active if ai_config else True
        })

    def post(self, request):
        user = request.user
        # Get or create AI configuration
        ai_config, created = AIConfiguration.objects.get_or_create(
            is_active=True,
            defaults={
                'model_name': 'gemini-1.5-flash',
                'api_key': 'AIzaSyCRtLRbJjbKgYDgCJzosRrF7nBbu5nd1RY',
                'max_tokens': 1000,
                'temperature': 0.7
            }
        )
        
        # Update AI configuration
        if 'ai_temperature' in request.data:
            ai_config.temperature = float(request.data['ai_temperature'])
        if 'ai_max_tokens' in request.data:
            ai_config.max_tokens = int(request.data['ai_max_tokens'])
        if 'model_name' in request.data:
            ai_config.model_name = request.data['model_name']
        if 'api_key' in request.data and request.user.role == 'ADMIN':
            ai_config.api_key = request.data['api_key']
        
        ai_config.save()
        
        # Update user's offline mode settings
        if 'offline_mode_enabled' in request.data:
            user.offline_mode_enabled = request.data['offline_mode_enabled']
        if 'offline_ai_message' in request.data:
            user.offline_ai_message = request.data['offline_ai_message']
        user.save()
        
        return Response({
            "message": "AI configuration updated successfully",
            "offline_mode_enabled": user.offline_mode_enabled,
            "offline_ai_message": user.offline_ai_message,
            "ai_temperature": ai_config.temperature,
            "ai_max_tokens": ai_config.max_tokens,
            "model_name": ai_config.model_name,
            "is_active": ai_config.is_active
        })


class AIConfigTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Allow any authenticated user to test AI configuration
        try:
            from .ai_service import AIService
            
            config = AIConfiguration.objects.filter(is_active=True).first()
            if not config:
                return Response({"error": "No active AI configuration found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Get test parameters from request
            test_message = request.data.get('message', 'Hello, this is a test message')
            user_name = request.user.name
            custom_message = request.data.get('custom_message', request.user.offline_ai_message)
            
            # Use the actual AI service to generate a response
            ai_service = AIService()
            ai_response = ai_service.generate_response(
                test_message, 
                user_name, 
                custom_message
            )
            
            return Response({
                "status": "success",
                "message": "AI configuration test completed successfully",
                "test_message": test_message,
                "response": ai_response,
                "config": {
                    "model_name": config.model_name,
                    "max_tokens": config.max_tokens,
                    "temperature": config.temperature
                }
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": f"AI configuration test failed: {str(e)}",
                "response": "I'm currently offline but will respond as soon as I'm back!"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)