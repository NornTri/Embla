from http import HTTPStatus

import pytest
from django.test import Client
from django.urls import reverse


@pytest.mark.django_db
def test_health_endpoint_is_public_and_reports_ok(client: Client):
    response = client.get(reverse("health"))

    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"status": "ok", "database": "available"}
