from django.contrib.auth.models import AbstractUser, Group, Permission, UserManager
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator

# Phone number validator
phone_validator = RegexValidator(regex=r'^\+?\d{10,15}$', message="Enter a valid phone number")

# Custom User Manager
class CustomUserManager(UserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
        
    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
            
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None 
    email = models.EmailField(unique=True)
    is_driver = models.BooleanField(default=False)
    is_client = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    # Use the custom manager
    objects = CustomUserManager()
    
    class Meta:
        db_table = 'drivo_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_driver', 'is_client']),
        ]
    
    def _str_(self):
        return self.email

class ClientProfile(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')
    full_name = models.CharField(max_length=100, blank=False, null=False)  # Made required
    cnic = models.CharField(max_length=15, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    phone_number = models.CharField(validators=[phone_validator], max_length=15, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    dp = models.ImageField(upload_to='profile_pics/', null=True, blank=True, default='profile_pics/default_client.png')
    last_location_update = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drivo_clientprofile'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def _str_(self):
        return self.full_name or f"Client ({self.user.email})"

class DriverProfile(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    full_name = models.CharField(max_length=100, blank=True, null=True)
    cnic = models.CharField(max_length=15, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    driving_license = models.CharField(max_length=50, blank=True, null=True)
    license_expiry = models.DateField(blank=True, null=True)
    phone_number = models.CharField(validators=[phone_validator], max_length=15, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('offline', 'Offline')
    ])
    dp = models.ImageField(upload_to='profile_pics/', null=True, blank=True, default='profile_pics/default_driver.png')
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(auto_now=True)
    
    # New fields for validation
    cnic_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    license_verified = models.BooleanField(default=False)
    city_verified = models.BooleanField(default=False)
    
    # Bank account information
    bank_account_type = models.CharField(max_length=20, choices=[
        ('bank_account', 'Bank Account'),
        ('jazzcash', 'JazzCash'),
        ('easypaisa', 'EasyPaisa'),
        ('paypal', 'PayPal'),
        ('onebill', 'OneBill'),
    ], default='bank_account')
    bank_account_number = models.CharField(max_length=30, blank=True, null=True)
    bank_account_holder = models.CharField(max_length=100, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account_verified = models.BooleanField(default=False)
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drivo_driverprofile'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['current_latitude', 'current_longitude']),
            models.Index(fields=['status', 'current_latitude', 'current_longitude']),
        ]
    
    def _str_(self):
        return self.full_name or f"Driver ({self.user.email})"

class RideRequest(models.Model):
    id = models.BigAutoField(primary_key=True)
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='ride_requests')
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    pickup_latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    pickup_longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    dropoff_latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    dropoff_longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    scheduled_datetime = models.DateTimeField(null=True, blank=True)
    vehicle_type = models.CharField(max_length=50, default='car', choices=[
        ('car', 'Car'),
        ('bike', 'Bike'),
        ('van', 'Van'),
        ('truck', 'Truck'),
        ('suv', 'SUV')
    ])
    fuel_type = models.CharField(max_length=50, default='petrol', choices=[
        ('petrol', 'Petrol'),
        ('cng', 'CNG'),
        ('diesel', 'Diesel')
    ])
    trip_type = models.CharField(max_length=50, default='one_way', choices=[
        ('one_way', 'One Way'),
        ('two_way', 'Two Way'),
        ('round_trip', 'Round Trip')
    ])
    estimated_fare = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drivo_ride_request'
        indexes = [
            models.Index(fields=['client']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def _str_(self):
        return f"Ride Request #{self.id} - {self.pickup_location} to {self.dropoff_location}"

class Ride(models.Model):
    id = models.BigAutoField(primary_key=True)
    request = models.ForeignKey(RideRequest, on_delete=models.CASCADE, related_name='rides', null=True)
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='rides')
    driver = models.ForeignKey(DriverProfile, on_delete=models.SET_NULL, related_name='rides', null=True, blank=True)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    pickup_latitude = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    pickup_longitude = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    dropoff_latitude = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    dropoff_longitude = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    scheduled_datetime = models.DateTimeField(null=True, blank=True)
    vehicle_type = models.CharField(max_length=50, default='car', choices=[
        ('car', 'Car'),
        ('bike', 'Bike'),
        ('van', 'Van'),
        ('truck', 'Truck'),
        ('suv', 'SUV')
    ])
    fuel_type = models.CharField(max_length=20, default='petrol', choices=[
        ('petrol', 'Petrol'),
        ('cng', 'CNG'),
        ('diesel', 'Diesel')
    ])
    trip_type = models.CharField(max_length=20, default='one_way', choices=[
        ('one_way', 'One Way'),
        ('two_way', 'Two Way'),
        ('round_trip', 'Round Trip')
    ])
    fare = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Add these fields if they don't exist
    distance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(max_length=20, default='requested', choices=[
        ('requested', 'Requested'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drivo_ride'
        indexes = [
            models.Index(fields=['request']),
            models.Index(fields=['client']),
            models.Index(fields=['driver']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def _str_(self):
        return f"Ride #{self.id} - {self.pickup_location} to {self.dropoff_location}"

class Payment(models.Model):
    id = models.BigAutoField(primary_key=True)
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='payments')
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='payments')
    driver = models.ForeignKey(DriverProfile, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    driver_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=50, choices=[
        ('cash', 'Cash'),
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
        ('jazzcash', 'JazzCash'),
        ('easypaisa', 'EasyPaisa'),
    ])
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded')
    ])
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drivo_payment'
        indexes = [
            models.Index(fields=['ride']),
            models.Index(fields=['client']),
            models.Index(fields=['driver']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def _str_(self):
        return f"Payment #{self.id} for Ride #{self.ride.id} - {self.amount}"

class Review(models.Model):
    id = models.BigAutoField(primary_key=True)
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='reviews', null=True)
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='reviews')
    driver = models.ForeignKey(DriverProfile, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'drivo_review'
        indexes = [
            models.Index(fields=['client']),
            models.Index(fields=['driver']),
            models.Index(fields=['ride']),
            models.Index(fields=['rating']),
        ]
        unique_together = ('ride', 'client', 'driver')
    
    def _str_(self):
        return f"Review for Ride {self.ride.id if self.ride else 'N/A'} by {self.client.user.email}"

class EmailOTP(models.Model):
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField(default=timezone.now() + timezone.timedelta(minutes=5))
    
    class Meta:
        db_table = 'drivo_emailotp'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
            models.Index(fields=['email', 'expires_at']),
        ]
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def _str_(self):
        return f"OTP for {self.email} - {'Used' if self.is_used else 'Active'}"

class NotificationPreference(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    ride_updates = models.BooleanField(default=True)
    promotions = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drivo_notificationpreference'
    
    def _str_(self):
        return f"Notification preferences for {self.user.email}"

class PushNotificationToken(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_tokens')
    token = models.CharField(max_length=255, unique=True)
    device_type = models.CharField(max_length=50, default='unknown', choices=[
        ('ios', 'iOS'),
        ('android', 'Android'),
        ('web', 'Web'),
        ('unknown', 'Unknown')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'drivo_pushnotificationtoken'
    
    def _str_(self):
        return f"Push token for {self.user.email} ({self.device_type})"

class Cancellation(models.Model):
    id = models.BigAutoField(primary_key=True)
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='cancellations')
    cancelled_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cancellations')
    cancellation_reason = models.TextField(blank=True, null=True)
    cancellation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'drivo_cancellation'
        indexes = [
            models.Index(fields=['ride']),
        ]
    
    def _str_(self):
        return f"Cancellation for Ride {self.ride.id} by {self.cancelled_by.email}"

class Earning(models.Model):
    id = models.BigAutoField(primary_key=True)
    driver = models.ForeignKey(DriverProfile, on_delete=models.CASCADE, related_name='earnings')
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='earnings')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'drivo_earning'
        indexes = [
            models.Index(fields=['driver']),
            models.Index(fields=['payment_status']),
        ]
    
    def _str_(self):
        return f"Earning of {self.amount} for {self.driver.user.email}"