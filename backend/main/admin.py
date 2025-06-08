from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Group, Message, GroupMembership, 
    BlockedUser, MessageStatus, AIConfiguration
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'name', 'is_online', 'role', 'is_active')
    list_filter = ('is_online', 'role', 'is_active', 'offline_mode_enabled')
    search_fields = ('username', 'email', 'name')
    ordering = ('username',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('name', 'email', 'profile_picture')}),
        ('Status', {'fields': ('is_online', 'last_seen', 'offline_mode_enabled', 'offline_ai_message')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'name', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('last_login', 'date_joined')


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'group_type', 'created_by', 'created_at')
    list_filter = ('group_type', 'created_at')
    search_fields = ('name', 'description')
    filter_horizontal = ('members',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'group', 'message_type', 'is_deleted', 'created_at')
    list_filter = ('message_type', 'is_deleted', 'created_at')
    search_fields = ('content', 'sender__username')
    readonly_fields = ('encrypted_content', 'encryption_key_id')


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'role', 'joined_at')
    list_filter = ('role', 'joined_at')
    search_fields = ('user__username', 'group__name')


@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ('blocker', 'blocked', 'blocked_at', 'reason')
    list_filter = ('blocked_at',)
    search_fields = ('blocker__username', 'blocked__username')


@admin.register(MessageStatus)
class MessageStatusAdmin(admin.ModelAdmin):
    list_display = ('message', 'user', 'status', 'timestamp')
    list_filter = ('status', 'timestamp')
    search_fields = ('message__content', 'user__username')


@admin.register(AIConfiguration)
class AIConfigurationAdmin(admin.ModelAdmin):
    list_display = ('model_name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    fields = ('model_name', 'max_tokens', 'temperature', 'is_active')
    readonly_fields = ('api_key',)  # Hide API key for security
