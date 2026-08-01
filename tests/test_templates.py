import re
from http import HTTPStatus
from pathlib import Path

import pytest
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.sites.models import Site
from django.contrib.staticfiles import finders
from django.template.loader import render_to_string
from django.test import Client
from django.test import RequestFactory
from django.urls import reverse


@pytest.mark.parametrize(
    "template_name",
    ["403.html", "403_csrf.html", "404.html", "500.html"],
)
def test_error_templates_render(rf: RequestFactory, template_name: str):
    """Error pages extend base.html; regression test for the navbar URL reversals."""
    request = rf.get("/some-error-page/")
    request.user = AnonymousUser()

    html = render_to_string(template_name, request=request)

    assert "Embla" in html


STATIC_REF_RE = re.compile(r"{%\s*static\s+['\"]([^'\"]+)['\"]")


def test_all_template_static_references_resolve():
    """Every literal {% static %} path must resolve via the staticfiles finders.

    Production uses whitenoise's manifest storage, which raises (a 500 at
    render time) for any path missing from the collectstatic manifest; the
    tolerant storage used under test would hide that.
    """
    template_dirs = [Path(d) for cfg in settings.TEMPLATES for d in cfg["DIRS"]]
    refs = {
        ref
        for template_dir in template_dirs
        for template in template_dir.rglob("*.html")
        for ref in STATIC_REF_RE.findall(template.read_text())
    }
    assert refs, "expected at least one {% static %} reference in templates"

    missing = sorted(ref for ref in refs if finders.find(ref) is None)
    assert not missing, f"static references with no backing file: {missing}"


@pytest.mark.django_db
def test_account_login_page_renders(client: Client):
    """The allauth login page exercises the entrance layout and base.html."""
    Site.objects.update_or_create(
        id=settings.SITE_ID,
        defaults={"domain": "testserver", "name": "testserver"},
    )

    response = client.get(reverse("account_login"))

    assert response.status_code == HTTPStatus.OK
