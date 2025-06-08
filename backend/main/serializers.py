from rest_framework import serializers
from .models import User, Group, Message, GroupMembership, BlockedUser, MessageStatus
import os


class UserSerializer(serializers.ModelSerializer):

    profile_picture = serializers.ImageField(
        max_length=None,
        use_url=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "username",
            "password",
            "profile_picture",
            "is_online",
            "last_seen",
            "offline_mode_enabled",
            "offline_ai_message",
        ]
        extra_kwargs = {
            "name": {"required": True},
            "email": {"required": True},
            "username": {"required": True},
            "password": {"write_only": True, "required": True},
            "profile_picture": {"required": False, "allow_null": True},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        profile_picture = validated_data.pop("profile_picture", None)
       
        # Handle profile picture deletion
        if profile_picture is not None:
            # Delete old picture if exists
            if instance.profile_picture:
                if os.path.isfile(instance.profile_picture.path):
                    os.remove(instance.profile_picture.path)
            instance.profile_picture = profile_picture
        elif 'profile_picture' in self.initial_data and self.initial_data['profile_picture'] is None:
            # Delete picture if explicitly set to null
            if instance.profile_picture:
                if os.path.isfile(instance.profile_picture.path):
                    os.remove(instance.profile_picture.path)
            instance.profile_picture = None

        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "username", "profile_picture", "is_online", "last_seen"]


class GroupSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    members = UserSearchSerializer(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = [
            "id", "name", "description", "group_type", "group_picture",
            "created_by", "members", "members_count", "created_at", "updated_at"
        ]
        read_only_fields = ['created_by']
    
    def get_members_count(self, obj):
        return obj.members.count()


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            "id", "group", "sender", "sender_name", "sender_username",
            "content", "message_type", "file_attachment", "file_url",
            "file_name", "file_size", "reply_to", "is_deleted",
            "created_at", "updated_at"
        ]

        read_only_fields = ["group", "sender", "message_type", "file_name", "file_size"]
    
    def get_file_url(self, obj):
        if obj.file_attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_attachment.url)
        return None


class GroupMembershipSerializer(serializers.ModelSerializer):
    user = UserSearchSerializer(read_only=True)
    
    class Meta:
        model = GroupMembership
        fields = ["id", "user", "role", "joined_at"]


class BlockedUserSerializer(serializers.ModelSerializer):
    blocked_user = UserSearchSerializer(source='blocked', read_only=True)
    
    class Meta:
        model = BlockedUser
        fields = ["id", "blocked_user", "blocked_at", "reason"]
