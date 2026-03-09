import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskapp.settings')
django.setup()

from accounts.models import User


def create_users():
    # Create admin
    if not User.objects.filter(username='ahmed_ali').exists():
        User.objects.create_superuser(
            username='ahmed_ali',
            email='ahmed@norka.dev',
            password='admin123',
            first_name='Ahmed',
            last_name='Ali',
            role='admin',
        )
        print("Admin created: ahmed_ali")
    else:
        print("Admin already exists")

    # Create supervisor
    if not User.objects.filter(username='sara_mohamed').exists():
        User.objects.create_user(
            username='sara_mohamed',
            email='sara@norka.dev',
            password='super123',
            first_name='Sara',
            last_name='Mohamed',
            role='supervisor',
        )
        print("Supervisor created: sara_mohamed")
    else:
        print("Supervisor already exists")

    # Employees
    employees = [
        {'username': 'omar_hassan', 'first': 'Omar', 'last': 'Hassan'},
        {'username': 'mona_ibrahim', 'first': 'Mona', 'last': 'Ibrahim'},
    ]

    for emp in employees:
        if not User.objects.filter(username=emp['username']).exists():
            User.objects.create_user(
                username=emp['username'],
                email=f"{emp['username']}@norka.dev",
                password='emp12345',
                first_name=emp['first'],
                last_name=emp['last'],
                role='employee',
            )
            print(f"Employee created: {emp['username']}")
        else:
            print(f"Employee already exists: {emp['username']}")

    print("\nFinished creating users successfully!")


if __name__ == "__main__":
    create_users()
