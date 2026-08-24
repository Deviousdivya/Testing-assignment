import csv
from itertools import chain
from decimal import Decimal

from django.db.models import Q
from django.http import HttpResponse, StreamingHttpResponse
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

from .models import Employee


EXPORT_COLUMNS = [
    'ID',
    'First name',
    'Last name',
    'Email',
    'Phone',
    'Date of birth',
    'Date of joining',
    'Salary',
    'Department',
    'Position',
]


def filtered_employees(params):
    queryset = Employee.objects.select_related('department', 'position').all()
    search = params.get('search', '').strip()
    start_date = params.get('joined_from', '').strip()
    end_date = params.get('joined_to', '').strip()

    if search:
        queryset = queryset.filter(
            Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(email__icontains=search)
            | Q(department__name__icontains=search)
        )
    if start_date:
        queryset = queryset.filter(date_of_joining__gte=start_date)
    if end_date:
        queryset = queryset.filter(date_of_joining__lte=end_date)
    return queryset


def employee_rows(queryset, chunk_size=2000):
    for employee in queryset.iterator(chunk_size=chunk_size):
        yield [
            employee.id,
            employee.first_name,
            employee.last_name,
            employee.email,
            employee.phone_number,
            employee.date_of_birth.isoformat(),
            employee.date_of_joining.isoformat(),
            str(Decimal(employee.salary)),
            employee.department.name,
            employee.position.title,
        ]


class Echo:
    def write(self, value):
        return value


def csv_response(queryset):
    writer = csv.writer(Echo())
    rows = (writer.writerow(row) for row in chain([EXPORT_COLUMNS], employee_rows(queryset)))
    response = StreamingHttpResponse(rows, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="employees.csv"'
    return response


def xlsx_response(queryset):
    workbook = Workbook(write_only=True)
    worksheet = workbook.create_sheet(title='Employees')
    worksheet.append(EXPORT_COLUMNS)
    for row in employee_rows(queryset):
        worksheet.append(row)

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="employees.xlsx"'
    workbook.save(response)
    return response


def pdf_response(queryset):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="employees.pdf"'
    document = SimpleDocTemplate(response, pagesize=landscape(letter))
    data = [EXPORT_COLUMNS] + list(employee_rows(queryset[:1000]))
    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F766E')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#CBD5E1')),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
            ]
        )
    )
    document.build([table])
    return response
