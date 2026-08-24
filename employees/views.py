from django.core.cache import cache
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import EmployeeSerializer
from .services import csv_response, filtered_employees, pdf_response, xlsx_response


def dashboard(request):
    return render(request, 'employees/dashboard.html')


class EmployeeListAPI(APIView):
    def get(self, request):
        cache_key = 'employees:list:' + request.META.get('QUERY_STRING', '')
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        queryset = filtered_employees(request.query_params)
        paginator = self.get_paginator()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = EmployeeSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        cache.set(cache_key, response.data, 60)
        return response

    @staticmethod
    def get_paginator():
        from rest_framework.settings import api_settings

        return api_settings.DEFAULT_PAGINATION_CLASS()


class EmployeeExportAPI(APIView):
    def get(self, request, file_format):
        queryset = filtered_employees(request.query_params)
        if file_format == 'csv':
            return csv_response(queryset)
        if file_format == 'xlsx':
            return xlsx_response(queryset)
        if file_format == 'pdf':
            return pdf_response(queryset)
        return Response({'detail': 'Unsupported export format.'}, status=400)
