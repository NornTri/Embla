from datetime import timedelta
from http import HTTPStatus

from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenVerifyView


class CookieTokenObtainPairView(TokenObtainPairView):
    """Set JWT tokens as httpOnly cookies"""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == HTTPStatus.OK:
            access_token = response.data.get("access")
            refresh_token = response.data.get("refresh")

            if access_token:
                response.set_cookie(
                    key="access_token",
                    value=access_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite="Strict",
                    max_age=timedelta(minutes=60).total_seconds(),
                )
            if refresh_token:
                response.set_cookie(
                    key="refresh_token",
                    value=refresh_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite="Strict",
                    max_age=timedelta(days=1).total_seconds(),
                )

            # Remove tokens from response body for security
            response.data.pop("access", None)
            response.data.pop("refresh", None)
            response.data["detail"] = "Login successful"

        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Refresh JWT token from refresh cookie"""

    def post(self, request, *args, **kwargs):
        # Try to get refresh token from cookie
        refresh_token = request.COOKIES.get("refresh_token")
        if refresh_token:
            request.data["refresh"] = refresh_token

        response = super().post(request, *args, **kwargs)

        if response.status_code == HTTPStatus.OK:
            access_token = response.data.get("access")

            if access_token:
                response.set_cookie(
                    key="access_token",
                    value=access_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite="Strict",
                    max_age=timedelta(minutes=60).total_seconds(),
                )

            # Remove token from response body
            response.data.pop("access", None)
            response.data["detail"] = "Token refreshed"

        return response


class CookieTokenVerifyView(TokenVerifyView):
    """Verify JWT token from access cookie"""

    def post(self, request, *args, **kwargs):
        # Try to get access token from cookie
        access_token = request.COOKIES.get("access_token")
        if access_token:
            request.data["token"] = access_token

        return super().post(request, *args, **kwargs)
