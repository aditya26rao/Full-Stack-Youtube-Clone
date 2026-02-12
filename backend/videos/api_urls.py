from django.urls import path
from videos import views

app_name = "videos_api"

urlpatterns = [
    path("", views.VideoListAPIView.as_view(), name="list"),
    path("channel/<str:username>/", views.api_channel_videos, name="channel"),
    path("channel/<str:username>/subscribe/", views.api_toggle_subscribe, name="subscribe"),
    path("subscribed-feed/", views.api_subscribed_feed, name="subscribed_feed"),
    path("trending/", views.api_trending_videos, name="trending"),
    path("history/", views.api_watch_history, name="history"),
    path("liked/", views.api_liked_videos, name="liked"),
    path("watch-later/", views.api_watch_later_list, name="watch_later_list"),
    path("upload/", views.api_video_upload, name="upload"),
    path("<int:video_id>/", views.api_video_detail, name="detail"),
    path("<int:video_id>/comments/", views.api_video_comments, name="comments"),
    path("<int:video_id>/comments/add/", views.api_add_comment, name="comment_add"),
    path("<int:video_id>/delete/", views.api_video_delete, name="delete"),
    path("<int:video_id>/watch-later/", views.api_watch_later_toggle, name="watch_later_toggle"),
    path("<int:video_id>/vote/", views.api_video_vote, name="vote"),
    path("comments/<int:comment_id>/like/", views.api_toggle_comment_like, name="comment_like"),
]
