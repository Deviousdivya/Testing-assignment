from datetime import date
from decimal import Decimal

from django.test import TestCase

from .models import Department, Employee, Position


class EmployeeApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        engineering = Department.objects.create(name='IT', location='Bengaluru')
        hr = Department.objects.create(name='HR', location='Mumbai')
        developer = Position.objects.create(title='Developer')
        analyst = Position.objects.create(title='Analyst')

        employees = []
        for index in range(30):
            employees.append(
                Employee(
                    first_name='Test',
                    last_name=f'User{index}',
                    email=f'user{index}@example.com',
                    phone_number=f'90000000{index:02d}',
                    date_of_birth=date(1990, 1, 1),
                    date_of_joining=date(2024, 1, 1),
                    salary=Decimal('75000.00'),
                    department=engineering if index % 2 == 0 else hr,
                    position=developer if index % 2 == 0 else analyst,
                )
            )
        Employee.objects.bulk_create(employees)

    def test_employee_api_is_paginated_and_searchable(self):
        response = self.client.get('/api/employees/', {'page_size': 10, 'search': 'IT'})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['count'], 15)
        self.assertEqual(len(payload['results']), 10)
        self.assertTrue(payload['next'])

    def test_employee_api_filters_join_date_range(self):
        response = self.client.get(
            '/api/employees/',
            {'joined_from': '2024-01-01', 'joined_to': '2024-01-31'},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['count'], 30)

    def test_export_endpoints_return_files(self):
        expected_types = {
            'csv': 'text/csv',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'pdf': 'application/pdf',
        }
        for file_format, content_type in expected_types.items():
            with self.subTest(file_format=file_format):
                response = self.client.get(f'/api/employees/export/{file_format}/')
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response['Content-Type'], content_type)

# Create your tests here.
