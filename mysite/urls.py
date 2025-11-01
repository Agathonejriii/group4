"""
MINIMAL TEST URLs - No includes, no apps
"""
from django.contrib import admin
from django.urls import path
from django.http import HttpResponse

def home(request):
    return HttpResponse("MINIMAL TEST - No redirects", content_type="text/html")

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
]

# NO OTHER PATTERNS
# NO INCLUDES
# NO APPS