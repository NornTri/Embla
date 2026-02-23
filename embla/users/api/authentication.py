from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    """JWT authentication that reads token from httpOnly cookie"""

    def authenticate(self, request):
        # Try to get token from cookie
        access_token = request.COOKIES.get("access_token")

        if not access_token:
            # Fall back to Authorization header
            return super().authenticate(request)

        # Validate token
        try:
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
        except InvalidToken:
            return None
        else:
            return (user, validated_token)
