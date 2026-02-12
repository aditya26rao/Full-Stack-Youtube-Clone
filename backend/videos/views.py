from datetime import timedelta

from django.contrib.auth.models import User
from django.db import DatabaseError
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import filters, generics, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from videos.imagekit_client import (
    delete_video as delete_imagekit_video,
    upload_thumbnail,
    upload_video,
)
from .forms import VideoUploadForm
from .models import (
    ChannelSubscription,
    Comment,
    CommentLike,
    Video,
    VideoLike,
    VideoView,
    WatchHistory,
    WatchLater,
)


class VideoListPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


class VideoListSerializer(serializers.ModelSerializer):
    video_url = serializers.CharField(source="Video_url")
    thumbnail_url = serializers.SerializerMethodField()
    streaming_url = serializers.SerializerMethodField()
    optimized_url = serializers.SerializerMethodField()
    channel = serializers.CharField(source="user.username")
    is_subscribed = serializers.SerializerMethodField()
    subscriber_count = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "description",
            "video_url",
            "thumbnail_url",
            "streaming_url",
            "optimized_url",
            "views",
            "unique_views",
            "likes",
            "dislikes",
            "channel",
            "subscriber_count",
            "is_subscribed",
            "created_at",
        ]

    def get_thumbnail_url(self, obj):
        return obj.display_thumbnail_url

    def get_streaming_url(self, obj):
        return obj.streaming_url

    def get_optimized_url(self, obj):
        return obj.optimized_url

    def get_is_subscribed(self, obj):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        if not user:
            return False
        return ChannelSubscription.objects.filter(subscriber=user, channel=obj.user).exists()

    def get_subscriber_count(self, obj):
        return ChannelSubscription.objects.filter(channel=obj.user).count()


class VideoListAPIView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = VideoListSerializer
    pagination_class = VideoListPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title"]
    ordering_fields = ["views", "created_at", "likes", "unique_views"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Video.objects.select_related("user").all()
        channel = (self.request.query_params.get("channel") or "").strip()
        if channel:
            queryset = queryset.filter(user__username__iexact=channel)
        return queryset


@api_view(["GET"])
@permission_classes([AllowAny])
def api_channel_videos(request, username):
    videos = Video.objects.select_related("user").filter(user__username=username)
    current_user = request.user if request.user.is_authenticated else None
    return Response(
        {
            "channel": username,
            "subscriber_count": ChannelSubscription.objects.filter(
                channel__username=username
            ).count(),
            "is_subscribed": bool(
                current_user
                and ChannelSubscription.objects.filter(
                    subscriber=current_user, channel__username=username
                ).exists()
            ),
            "results": [_serialize_video(video, current_user) for video in videos],
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_video_detail(request, video_id):
    video = get_object_or_404(Video.objects.select_related("user"), id=video_id)
    current_user = request.user if request.user.is_authenticated else None
    _record_video_view(request, current_user, video)
    _record_watch_history(current_user, video)

    data = _serialize_video(video, current_user)
    data["user_vote"] = _get_user_vote_value(current_user, video)
    data["is_watch_later"] = _is_watch_later(current_user, video)
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_video_vote(request, video_id):
    current_user = request.user
    video = get_object_or_404(Video, id=video_id)
    vote_type = request.data.get("vote")
    result, status_code = _apply_video_vote(video, current_user, vote_type)
    return Response(result, status=status_code)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_video_upload(request):
    current_user = request.user
    form = VideoUploadForm(request.POST, request.FILES)
    if form.is_valid():
        video_file = form.cleaned_data["video_file"]
        custom_thumbnail = request.POST.get("thumbnail_data", "")

        try:
            result = upload_video(file_data=video_file.read(), file_name=video_file.name)
            thumbnail_url = ""
            thumbnail_file = request.FILES.get("thumbnail_file")
            if thumbnail_file:
                try:
                    base_name = video_file.name.split(".", 1)[0]
                    thumb_result = upload_thumbnail(
                        file_data=thumbnail_file.read(),
                        file_name=thumbnail_file.name or base_name + "_thumb.jpg",
                    )
                    thumbnail_url = thumb_result["url"]
                except Exception:
                    pass
            elif custom_thumbnail and custom_thumbnail.startswith("data:image"):
                try:
                    base_name = video_file.name.split(".", 1)[0]
                    thumb_result = upload_thumbnail(
                        file_data=custom_thumbnail, file_name=base_name + "_thumb.jpg"
                    )
                    thumbnail_url = thumb_result["url"]
                except Exception:
                    pass

            video = Video.objects.create(
                user=current_user,
                title=form.cleaned_data["title"],
                description=form.cleaned_data["description"],
                file_id=result["file_id"],
                Video_url=result["url"],
                thumbnail_url=thumbnail_url,
            )
            return Response({"success": True, "video_id": video.id})
        except Exception as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    errors = []
    for field, field_errors in form.errors.items():
        for error in field_errors:
            errors.append(f"{field}: {error}" if field != "__all__" else error)
    return Response(
        {"success": False, "error": "; ".join(errors)},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_video_delete(request, video_id):
    current_user = request.user
    video = get_object_or_404(Video, id=video_id, user=current_user)
    try:
        delete_imagekit_video(video.file_id)
    except Exception:
        pass
    video.delete()
    return Response({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_watch_history(request):
    current_user = request.user
    history_items = (
        WatchHistory.objects.select_related("video", "video__user")
        .filter(user=current_user)
        .order_by("-watched_at")
    )
    results = []
    for item in history_items:
        data = _serialize_video(item.video, current_user)
        data["watched_at"] = item.watched_at.isoformat()
        results.append(data)
    return Response({"results": results})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_liked_videos(request):
    current_user = request.user
    liked_items = (
        VideoLike.objects.select_related("video", "video__user")
        .filter(user=current_user, value=VideoLike.LIKE)
        .order_by("-created_at")
    )
    return Response(
        {"results": [_serialize_video(item.video, current_user) for item in liked_items]}
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_watch_later_list(request):
    current_user = request.user
    items = (
        WatchLater.objects.select_related("video", "video__user")
        .filter(user=current_user)
        .order_by("-created_at")
    )
    results = []
    for item in items:
        data = _serialize_video(item.video, current_user)
        data["saved_at"] = item.created_at.isoformat()
        results.append(data)
    return Response({"results": results})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_watch_later_toggle(request, video_id):
    current_user = request.user
    video = get_object_or_404(Video, id=video_id)
    existing = WatchLater.objects.filter(user=current_user, video=video).first()
    if existing:
        existing.delete()
        return Response({"success": True, "is_watch_later": False})

    WatchLater.objects.create(user=current_user, video=video)
    return Response({"success": True, "is_watch_later": True})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_video_comments(request, video_id):
    current_user = request.user if request.user.is_authenticated else None
    comments = (
        Comment.objects.select_related("user")
        .filter(video_id=video_id, parent__isnull=True)
        .order_by("-created_at")
    )
    return Response(
        {"results": [_serialize_comment(comment, current_user) for comment in comments]}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_add_comment(request, video_id):
    text = (request.data.get("text") or "").strip()
    parent_id = request.data.get("parent_id")
    if not text:
        return Response(
            {"success": False, "error": "Comment text is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    video = get_object_or_404(Video, id=video_id)
    parent = None
    if parent_id:
        parent = get_object_or_404(Comment, id=parent_id, video=video)

    comment = Comment.objects.create(
        user=request.user,
        video=video,
        parent=parent,
        text=text,
    )
    return Response({"success": True, "comment": _serialize_comment(comment, request.user)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_toggle_comment_like(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    existing = CommentLike.objects.filter(user=request.user, comment=comment).first()
    if existing:
        existing.delete()
        if comment.likes > 0:
            comment.likes -= 1
            comment.save(update_fields=["likes"])
        return Response({"success": True, "liked": False, "likes": comment.likes})

    CommentLike.objects.create(user=request.user, comment=comment)
    comment.likes += 1
    comment.save(update_fields=["likes"])
    return Response({"success": True, "liked": True, "likes": comment.likes})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_trending_videos(request):
    week_ago = timezone.now() - timedelta(days=7)
    videos = (
        Video.objects.select_related("user")
        .annotate(
            recent_unique_views=Count(
                "view_records",
                filter=Q(view_records__viewed_at__gte=week_ago),
                distinct=True,
            ),
            comment_count=Count("comments", distinct=True),
        )
        .order_by("-recent_unique_views", "-likes", "-comment_count", "-views")[:30]
    )
    current_user = request.user if request.user.is_authenticated else None
    return Response(
        {"results": [_serialize_video(video, current_user) for video in videos]}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_toggle_subscribe(request, username):
    channel = get_object_or_404(User, username=username)
    if channel == request.user:
        return Response(
            {"success": False, "error": "You cannot subscribe to your own channel."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    existing = ChannelSubscription.objects.filter(
        subscriber=request.user, channel=channel
    ).first()
    if existing:
        existing.delete()
        is_subscribed = False
    else:
        ChannelSubscription.objects.create(subscriber=request.user, channel=channel)
        is_subscribed = True

    subscriber_count = ChannelSubscription.objects.filter(channel=channel).count()
    return Response(
        {
            "success": True,
            "is_subscribed": is_subscribed,
            "subscriber_count": subscriber_count,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_subscribed_feed(request):
    channel_ids = ChannelSubscription.objects.filter(subscriber=request.user).values_list(
        "channel_id", flat=True
    )
    videos = Video.objects.select_related("user").filter(user_id__in=channel_ids)

    paginator = VideoListPagination()
    page = paginator.paginate_queryset(videos, request)
    results = [_serialize_video(video, request.user) for video in page]
    return paginator.get_paginated_response(results)


def _get_user_vote_value(user, video):
    if not user:
        return None
    try:
        like = VideoLike.objects.filter(user=user, video=video).first()
    except DatabaseError:
        return None
    if not like:
        return None
    return like.value


def _serialize_video(video, current_user=None):
    return {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "video_url": video.Video_url,
        "thumbnail_url": video.display_thumbnail_url,
        "streaming_url": video.streaming_url,
        "optimized_url": video.optimized_url,
        "views": video.views,
        "unique_views": video.unique_views,
        "likes": video.likes,
        "dislikes": video.dislikes,
        "channel": video.user.username,
        "subscriber_count": ChannelSubscription.objects.filter(channel=video.user).count(),
        "is_subscribed": bool(
            current_user
            and ChannelSubscription.objects.filter(
                subscriber=current_user, channel=video.user
            ).exists()
        ),
        "created_at": video.created_at.isoformat(),
    }


def _serialize_comment(comment, current_user):
    replies = (
        Comment.objects.select_related("user")
        .filter(parent=comment)
        .order_by("created_at")
    )
    liked = bool(
        current_user
        and CommentLike.objects.filter(user=current_user, comment=comment).exists()
    )
    return {
        "id": comment.id,
        "video_id": comment.video_id,
        "parent_id": comment.parent_id,
        "text": comment.text,
        "likes": comment.likes,
        "liked": liked,
        "author": comment.user.username,
        "created_at": comment.created_at.isoformat(),
        "replies": [
            {
                "id": reply.id,
                "video_id": reply.video_id,
                "parent_id": reply.parent_id,
                "text": reply.text,
                "likes": reply.likes,
                "liked": bool(
                    current_user
                    and CommentLike.objects.filter(
                        user=current_user, comment=reply
                    ).exists()
                ),
                "author": reply.user.username,
                "created_at": reply.created_at.isoformat(),
            }
            for reply in replies
        ],
    }


def _is_watch_later(user, video):
    if not user:
        return False
    try:
        return WatchLater.objects.filter(user=user, video=video).exists()
    except DatabaseError:
        return False


def _record_watch_history(user, video):
    if not user:
        return
    try:
        entry, created = WatchHistory.objects.get_or_create(user=user, video=video)
        if not created:
            entry.save(update_fields=["watched_at"])
    except DatabaseError:
        return


def _record_video_view(request, user, video):
    video.views += 1
    video.save(update_fields=["views"])

    viewer_key = _get_viewer_key(request, user)
    if not viewer_key:
        return

    try:
        _, created = VideoView.objects.get_or_create(video=video, viewer_key=viewer_key)
        if created:
            video.unique_views += 1
            video.save(update_fields=["unique_views"])
    except DatabaseError:
        return


def _get_viewer_key(request, user):
    if user:
        return f"user:{user.id}"
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    ip = (forwarded_for.split(",")[0].strip() if forwarded_for else "").strip()
    if not ip:
        ip = (request.META.get("REMOTE_ADDR") or "").strip()
    if not ip:
        return ""
    return f"ip:{ip}"


def _apply_video_vote(video, user, vote_type):
    if vote_type not in ["like", "dislike"]:
        return {"success": False, "error": "Invalid vote"}, 400

    value = VideoLike.LIKE if vote_type == "like" else VideoLike.DISLIKE
    existing_vote = VideoLike.objects.filter(user=user, video=video).first()

    if existing_vote:
        if existing_vote.value == value:
            if value == VideoLike.LIKE and video.likes > 0:
                video.likes -= 1
            elif value == VideoLike.DISLIKE and video.dislikes > 0:
                video.dislikes -= 1
            existing_vote.delete()
            user_vote = None
        else:
            if value == VideoLike.LIKE:
                video.likes += 1
                if video.dislikes > 0:
                    video.dislikes -= 1
            else:
                video.dislikes += 1
                if video.likes > 0:
                    video.likes -= 1
            existing_vote.value = value
            existing_vote.save()
            user_vote = value
    else:
        VideoLike.objects.create(user=user, video=video, value=value)
        if value == VideoLike.LIKE:
            video.likes += 1
        else:
            video.dislikes += 1
        user_vote = value

    video.save(update_fields=["likes", "dislikes"])
    return {
        "success": True,
        "likes": video.likes,
        "dislikes": video.dislikes,
        "user_vote": user_vote,
    }, 200
