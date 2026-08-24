from django.urls import path

from .views import EmployeeExportAPI, EmployeeListAPI, dashboard

urlpatterns = [
    path('', dashboard, name='employee-dashboard'),
    path('api/employees/', EmployeeListAPI.as_view(), name='employee-list-api'),
    path('api/employees/export/<str:file_format>/', EmployeeExportAPI.as_view(), name='employee-export-api'),
]
