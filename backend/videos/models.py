from django.db import models
from django.contrib.auth.models import User
from videos.imagekit_client import (
    get_optimized_video_url,
    get_streaming_url,
    get_thumbnail_url,
)


# Create your models here.
class Video(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="videos")
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    file_id = models.CharField(max_length=200)
    Video_url = models.URLField(max_length=500)
    thumbnail_url = models.URLField(max_length=500, blank=True)

    views = models.PositiveIntegerField(default=0)
    unique_views = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)
    dislikes = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def display_thumbnail_url(self):
        if self.thumbnail_url and "/thumbnails/" in self.thumbnail_url:
            return self.thumbnail_url
        return self.generated_thumbnail_url

    @property
    def generated_thumbnail_url(self):
        if not self.Video_url:
            return ""
        return get_thumbnail_url(self.Video_url)

    @property
    def streaming_url(self):
        if not self.Video_url:
            return ""
        return get_streaming_url(self.Video_url)

    @property
    def optimized_url(self):
        if not self.Video_url:
            return ""
        return get_optimized_video_url(self.Video_url)
    
class VideoLike(models.Model):
    LIKE = 1
    DISLIKE = -1
    LIKE_CHOICE = [
        (LIKE,'Like'),
        (DISLIKE,'Dislike'),
    ]
    
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    video = models.ForeignKey(Video,on_delete=models.CASCADE,related_name='user_likes')
    value = models.SmallIntegerField(choices=LIKE_CHOICE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ["user", "video"]
        
    def __str__(self):
        action = 'lliked' if self.value == self.LIKE else 'disliked'
        return f"{self.user.username} {action} {self.video.title}"


class WatchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watch_history")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="history_entries")
    watched_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["user", "video"]
        ordering = ["-watched_at"]

    def __str__(self):
        return f"{self.user.username} watched {self.video.title}"


class WatchLater(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watch_later_items")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="saved_by_users")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "video"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} saved {self.video.title}"


class VideoView(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="view_records")
    viewer_key = models.CharField(max_length=255)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["video", "viewer_key"]
        ordering = ["-viewed_at"]

    def __str__(self):
        return f"{self.viewer_key} viewed {self.video.title}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="video_comments")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="comments")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True,
    )
    text = models.TextField()
    likes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username}: {self.text[:40]}"


class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked_comments")
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="user_likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "comment"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} liked comment {self.comment_id}"


class ChannelSubscription(models.Model):
    subscriber = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="channel_subscriptions"
    )
    channel = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="channel_subscribers"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["subscriber", "channel"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subscriber.username} subscribed {self.channel.username}"
