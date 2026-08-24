import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from employees.models import Department, Employee, Position


FIRST_NAMES = ['Aarav', 'Anaya', 'Bhavya', 'Diya', 'Ishaan', 'Kavya', 'Mira', 'Neel', 'Riya', 'Vivaan']
LAST_NAMES = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Mehta', 'Rao', 'Das', 'Nair', 'Joshi']
DEPARTMENTS = [
    ('HR', 'Mumbai'),
    ('IT', 'Bengaluru'),
    ('Sales', 'Delhi'),
    ('Finance', 'Pune'),
    ('Operations', 'Hyderabad'),
    ('Marketing', 'Chennai'),
]
POSITIONS = ['Manager', 'Developer', 'Analyst', 'Designer', 'Consultant', 'Engineer', 'Specialist']


class Command(BaseCommand):
    help = 'Seed departments, positions, and a large employee dataset with bulk_create.'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=250000)
        parser.add_argument('--batch-size', type=int, default=5000)

    def handle(self, *args, **options):
        count = options['count']
        batch_size = options['batch_size']

        departments = [
            Department.objects.get_or_create(name=name, defaults={'location': location})[0]
            for name, location in DEPARTMENTS
        ]
        positions = [Position.objects.get_or_create(title=title)[0] for title in POSITIONS]
        existing = Employee.objects.count()
        remaining = max(count - existing, 0)
        if remaining == 0:
            self.stdout.write(self.style.SUCCESS(f'Employee table already has {existing:,} rows.'))
            return

        self.stdout.write(f'Creating {remaining:,} employees in batches of {batch_size:,}...')
        start_index = existing + 1
        today = date.today()

        for batch_start in range(start_index, start_index + remaining, batch_size):
            batch_end = min(batch_start + batch_size, start_index + remaining)
            batch = []
            for number in range(batch_start, batch_end):
                first_name = random.choice(FIRST_NAMES)
                last_name = random.choice(LAST_NAMES)
                department = random.choice(departments)
                position = random.choice(positions)
                batch.append(
                    Employee(
                        first_name=first_name,
                        last_name=last_name,
                        email=f'{first_name.lower()}.{last_name.lower()}.{number}@example.com',
                        phone_number=f'9{number % 1000000000:09d}',
                        date_of_birth=today - timedelta(days=random.randint(22 * 365, 60 * 365)),
                        date_of_joining=today - timedelta(days=random.randint(0, 12 * 365)),
                        salary=random.randint(350000, 2500000) / 100,
                        department=department,
                        position=position,
                    )
                )
            with transaction.atomic():
                Employee.objects.bulk_create(batch, batch_size=batch_size)
            self.stdout.write(f'Inserted {batch_end - 1:,}/{count:,}')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
