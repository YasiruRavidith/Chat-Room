from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.db import models

# TODO: Declare field validators

# TODO: Create authentication backend for custom user model


class UserManager(BaseUserManager):
    "Custom user manager"
    
    def create_user(self, email, username, password=None, **args):
        "Create and return a user"
        if not email:
            raise ValueError(_("The email must be set"))
        if not username:
            raise ValueError(_("The username must be set"))
        if ("role" in args) and (args["role"] == User.Role.ADMIN):
            raise ValueError(_("The role must be set"))
        email = self.normalize_email(email)
        user = self.model(
            email=email, username=username, is_active=True, is_staff=True, **args
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password, **args):
        "Create and return a superuser"
        args.update(
            {
                "is_staff": True,
                "is_active": True,
                "is_superuser": True,
                "role": User.Role.ADMIN,
            }
        )

        if not args["is_staff"]:
            raise ValueError(_("Superuser must have is_staff=True."))
        if not args["is_superuser"]:
            raise ValueError(_("Superuser must have is_superuser=True."))
        if args["role"] != User.Role.ADMIN:
            raise ValueError(_("Superuser must have role of Admin."))

        return self.create_user(email, username, password, **args)


class User(AbstractUser):

    class Role(models.TextChoices):
        USER = 'user', _('User')
        ADMIN = 'admin', _('Admin')

    # Core personal information
    name = models.CharField(_("name"), max_length=255)
    email = models.EmailField(_("email"), unique=True)
    username = models.CharField(max_length=150, unique=True)    # Profile information
    profile_picture = models.ImageField(
        _("profile picture"), upload_to="profile_pics/", null=True, blank=True
    )
    role = models.CharField(
        max_length=10, 
        choices=Role.choices, 
        default=Role.USER
    )
    
    # Status fields
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    offline_mode_enabled = models.BooleanField(default=False)
    offline_ai_message = models.TextField(
        default="I'm currently offline. I'll get back to you soon! For now, you can chat with my AI assistant.",
        blank=True
    )

    # Metadata
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    # Remove unused fields from AbstractUser
    groups = None
    last_name = None
    first_name = None
    user_permissions = None    # Authentication Config
    objects = UserManager()
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["name", "email"]

    class Meta:
        ordering = ["username"]
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return self.username


# Chat and Group Models

class Group(models.Model):
    class GroupType(models.TextChoices):
        PRIVATE = 'private', _('Private Chat')
        GROUP = 'group', _('Group Chat')

    name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    group_type = models.CharField(
        max_length=10,
        choices=GroupType.choices,
        default=GroupType.PRIVATE
    )
    group_picture = models.ImageField(
        upload_to="group_pics/", null=True, blank=True
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_groups'
    )
    members = models.ManyToManyField(
        User, through='GroupMembership', related_name='groups'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        if self.group_type == self.GroupType.PRIVATE:
            members = list(self.members.all())
            if len(members) >= 2:
                return f"{members[0].username} & {members[1].username}"
        return self.name or f"Group {self.id}"


class GroupMembership(models.Model):
    class Role(models.TextChoices):
        MEMBER = 'member', _('Member')
        ADMIN = 'admin', _('Admin')
        OWNER = 'owner', _('Owner')

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MEMBER
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_message = models.ForeignKey(
        'Message', on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        unique_together = ('user', 'group')


class Message(models.Model):
    class MessageType(models.TextChoices):
        TEXT = 'text', _('Text')
        IMAGE = 'image', _('Image')
        FILE = 'file', _('File')
        SYSTEM = 'system', _('System')
        AI_RESPONSE = 'ai_response', _('AI Response')

    class MessageStatus(models.TextChoices):
        SENT = 'sent', _('Sent')
        DELIVERED = 'delivered', _('Delivered')
        READ = 'read', _('Read')

    group = models.ForeignKey(
        Group, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_messages'
    )
    content = models.TextField(blank=True)
    message_type = models.CharField(
        max_length=15,
        choices=MessageType.choices,
        default=MessageType.TEXT
    )
    file_attachment = models.FileField(
        upload_to="message_files/", null=True, blank=True
    )
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    
    # Encryption
    encrypted_content = models.TextField(blank=True)
    encryption_key_id = models.CharField(max_length=255, blank=True)
    
    # Metadata
    reply_to = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True
    )
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


class MessageStatus(models.Model):
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name='status_updates'
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=10,
        choices=Message.MessageStatus.choices,
        default=Message.MessageStatus.SENT
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')


class BlockedUser(models.Model):
    blocker = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='blocking'
    )
    blocked = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='blocked_by'
    )
    blocked_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)

    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"


class UserSearch(models.Model):
    """Track user searches for analytics"""
    searcher = models.ForeignKey(User, on_delete=models.CASCADE)
    search_term = models.CharField(max_length=255)
    results_count = models.PositiveIntegerField(default=0)
    searched_at = models.DateTimeField(auto_now_add=True)


class AIConfiguration(models.Model):
    """Store AI configuration for offline mode"""
    api_key = models.CharField(max_length=255, default="AIzaSyCRtLRbJjbKgYDgCJzosRrF7nBbu5nd1RY")
    model_name = models.CharField(max_length=100, default="gemini-pro")
    max_tokens = models.PositiveIntegerField(default=1000)
    temperature = models.FloatField(default=0.7)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "AI Configuration"
        verbose_name_plural = "AI Configurations"
