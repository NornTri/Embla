from django.db import OperationalError
from django.db import connection
from django.db import transaction
from django.http import HttpRequest
from django.http import JsonResponse


# Without non_atomic_requests, ATOMIC_REQUESTS would open the DB connection
# before the view body runs, turning a DB outage into an unhandled 500
@transaction.non_atomic_requests
def health(request: HttpRequest) -> JsonResponse:
    """Lightweight health check used by the frontend health monitor."""
    try:
        connection.ensure_connection()
    except OperationalError:
        return JsonResponse(
            {"status": "unhealthy", "database": "unavailable"},
            status=503,
        )
    return JsonResponse({"status": "ok", "database": "available"})
