# Generated by Django 5.2 on 2025-05-04 11:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stock_scraper', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='StockOHLC',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('symbol', models.CharField(max_length=20)),
                ('date', models.DateField()),
                ('open', models.FloatField()),
                ('high', models.FloatField()),
                ('low', models.FloatField()),
                ('close', models.FloatField()),
                ('percent', models.FloatField()),
                ('volume', models.BigIntegerField()),
            ],
        ),
        migrations.DeleteModel(
            name='Stock',
        ),
    ]
