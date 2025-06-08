from main.views import (
    UserCreateView, UserDetailView, UserInfoView, UserSearchView, UpdateOnlineStatusView,
    GroupListCreateView, GroupDetailView, CreatePrivateChatView, GroupMembersView, LeaveGroupView,
    MessageListCreateView, MessageDetailView, MessageStatusView, MarkMessagesReadView,
    BlockedUsersListView, BlockUserView, UnblockUserView, AIConfigurationView, AIConfigTestView
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenBlacklistView,
    TokenRefreshView,
)
from django.urls import path, include
from django.contrib import admin
from django.conf import settings 
from django.conf.urls.static import static 

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Authentication
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    
    # User management
    path("api/users/register/", UserCreateView.as_view(), name="user_register"),
    path("api/users/profile/", UserDetailView.as_view(), name="user_profile"),
    path("api/users/info/", UserInfoView.as_view(), name="user_info"),
    path("api/users/search/", UserSearchView.as_view(), name="user_search"),
    path("api/users/status/", UpdateOnlineStatusView.as_view(), name="update_status"),
    
    # Groups and chats
    path("api/groups/", GroupListCreateView.as_view(), name="group_list_create"),
    path("api/groups/<int:pk>/", GroupDetailView.as_view(), name="group_detail"),
    path("api/groups/private/create/", CreatePrivateChatView.as_view(), name="create_private_chat"),
    path("api/groups/<int:group_id>/members/", GroupMembersView.as_view(), name="group_members"),
    path("api/groups/<int:group_id>/leave/", LeaveGroupView.as_view(), name="leave_group"),
      # Messages
    path("api/groups/<int:group_id>/messages/", MessageListCreateView.as_view(), name="message_list_create"),
    path("api/groups/<int:group_id>/messages/read/", MarkMessagesReadView.as_view(), name="mark_messages_read"),
    path("api/messages/<int:pk>/", MessageDetailView.as_view(), name="message_detail"),
    path("api/messages/<int:message_id>/status/", MessageStatusView.as_view(), name="message_status"),    # Blocking
    path("api/blocked-users/", BlockedUsersListView.as_view(), name="blocked_users"),
    path("api/users/blocked/", BlockedUsersListView.as_view(), name="blocked_users_alt"),
    path("api/users/block/", BlockUserView.as_view(), name="block_user"),
    path("api/users/unblock/", UnblockUserView.as_view(), name="unblock_user"),
    path("api/users/unblock/<int:user_id>/", UnblockUserView.as_view(), name="unblock_user_by_id"),
      # AI Configuration
    path("api/ai/config/", AIConfigurationView.as_view(), name="ai_config"),
    path("api/ai/config/test/", AIConfigTestView.as_view(), name="ai_config_test"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
