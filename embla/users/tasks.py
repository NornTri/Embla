from celery import shared_task


@shared_task()
def get_users_count():
    """A pointless Celery task to demonstrate usage."""
    from .models import User  # noqa: PLC0415

    return User.objects.count()
