from django.contrib import admin

from .models import Department, Employee, Position


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    search_fields = ['name', 'location']
    list_display = ['name', 'location', 'created_at']


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    search_fields = ['title']
    list_display = ['title', 'created_at']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['id', 'first_name', 'last_name', 'email', 'department', 'position', 'date_of_joining', 'salary']
    list_filter = ['department', 'position', 'date_of_joining']
    search_fields = ['first_name', 'last_name', 'email', 'phone_number', 'department__name']
    autocomplete_fields = ['department', 'position']
    list_select_related = ['department', 'position']

# Register your models here.
