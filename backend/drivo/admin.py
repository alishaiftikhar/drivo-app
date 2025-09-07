from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django import forms
from decimal import Decimal
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    User, DriverProfile, ClientProfile, Ride, Payment, Review, 
    EmailOTP, NotificationPreference, PushNotificationToken, RideRequest,
    Cancellation, Earning
)

# Custom form for ClientProfile to handle DecimalField properly
class ClientProfileAdminForm(forms.ModelForm):
    class Meta:
        model = ClientProfile
        fields = '__all__'
    
    def clean_latitude(self):
        latitude = self.cleaned_data.get('latitude')
        if latitude is not None:
            try:
                if isinstance(latitude, str):
                    latitude = Decimal(latitude)
                else:
                    latitude = Decimal(str(latitude))
                latitude = round(latitude, 6)
            except Exception as e:
                raise forms.ValidationError(f"Invalid latitude value: {e}")
        return latitude
    
    def clean_longitude(self):
        longitude = self.cleaned_data.get('longitude')
        if longitude is not None:
            try:
                if isinstance(longitude, str):
                    longitude = Decimal(longitude)
                else:
                    longitude = Decimal(str(longitude))
                longitude = round(longitude, 6)
            except Exception as e:
                raise forms.ValidationError(f"Invalid longitude value: {e}")
        return longitude

# Custom form for DriverProfile to handle DecimalField properly
class DriverProfileAdminForm(forms.ModelForm):
    class Meta:
        model = DriverProfile
        fields = '__all__'
    
    def clean_current_latitude(self):
        latitude = self.cleaned_data.get('current_latitude')
        if latitude is not None:
            try:
                if isinstance(latitude, str):
                    latitude = Decimal(latitude)
                else:
                    latitude = Decimal(str(latitude))
                latitude = round(latitude, 6)
                if latitude < -90 or latitude > 90:
                    raise forms.ValidationError("Latitude must be between -90 and 90")
            except Exception as e:
                raise forms.ValidationError(f"Invalid latitude value: {e}")
        return latitude
    
    def clean_current_longitude(self):
        longitude = self.cleaned_data.get('current_longitude')
        if longitude is not None:
            try:
                if isinstance(longitude, str):
                    longitude = Decimal(longitude)
                else:
                    longitude = Decimal(str(longitude))
                longitude = round(longitude, 6)
                if longitude < -180 or longitude > 180:
                    raise forms.ValidationError("Longitude must be between -180 and 180")
            except Exception as e:
                raise forms.ValidationError(f"Invalid longitude value: {e}")
        return longitude

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'is_driver', 'is_client', 'is_active', 'date_joined')
    list_filter = ('is_driver', 'is_client', 'is_active', 'date_joined')
    search_fields = ('email',)
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_driver', 'is_client', 'is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_driver', 'is_client', 'is_active')
        }),
    )

@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    form = DriverProfileAdminForm
    list_display = ('user', 'full_name', 'city', 'status', 'phone_number')
    list_filter = ('status', 'city', 'bank_account_type')  
    search_fields = ('user__email', 'full_name', 'phone_number', 'driving_license', 'cnic')
    readonly_fields = ('last_location_update',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'full_name', 'age', 'cnic', 'phone_number', 'city', 'dp')
        }),
        ('Driver Details', {
            'fields': ('driving_license', 'license_expiry', 'status')
        }),
        ('Verification Status', {
            'fields': ('cnic_verified', 'phone_verified', 'license_verified', 'city_verified')
        }),
        ('Location Information', {
            'fields': ('current_latitude', 'current_longitude', 'last_location_update')
        }),
        ('Bank Account Information', {
            'fields': (
                'bank_account_type', 'bank_account_number', 'bank_account_holder', 
                'bank_name', 'bank_account_verified'
            )
        }),
    )
    
    actions = ['approve_drivers', 'reject_drivers', 'make_available', 'make_offline']
    
    def approve_drivers(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='approved')
        self.message_user(request, f"{updated} drivers have been approved.")
    approve_drivers.short_description = "Approve selected drivers"
    
    def reject_drivers(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='rejected')
        self.message_user(request, f"{updated} drivers have been rejected.")
    reject_drivers.short_description = "Reject selected drivers"
    
    def make_available(self, request, queryset):
        updated = queryset.filter(status__in=['approved', 'offline']).update(status='available')
        self.message_user(request, f"{updated} drivers are now available.")
    make_available.short_description = "Mark selected drivers as available"
    
    def make_offline(self, request, queryset):
        updated = queryset.filter(status__in=['available', 'busy']).update(status='offline')
        self.message_user(request, f"{updated} drivers are now offline.")
    make_offline.short_description = "Mark selected drivers as offline"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    form = ClientProfileAdminForm
    list_display = ('user', 'full_name', 'cnic', 'age', 'phone_number', 'address', 'display_dp', 'display_location')
    search_fields = ('user__email', 'full_name', 'cnic', 'phone_number', 'address')
    readonly_fields = ('last_location_update',)
    
    fieldsets = (
        ('Basic Information', {'fields': ('user', 'full_name', 'age', 'cnic', 'phone_number', 'address', 'dp')}),
        ('Location Information', {'fields': ('latitude', 'longitude', 'last_location_update')}),
    )
    
    def display_dp(self, obj):
        if obj.dp:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.dp.url)
        return "No Image"
    display_dp.short_description = 'Profile Picture'
    
    def display_location(self, obj):
        if obj.latitude and obj.longitude:
            return f"{obj.latitude}, {obj.longitude}"
        return "No Location"
    display_location.short_description = 'Location'

@admin.register(RideRequest)
class RideRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'pickup_location', 'dropoff_location', 'scheduled_datetime', 'status', 'created_at')
    list_filter = ('status', 'fuel_type', 'vehicle_type', 'trip_type', 'created_at')
    search_fields = ('pickup_location', 'dropoff_location', 'client_user_email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Request Details', {'fields': ('client', 'status', 'created_at', 'updated_at')}),
        ('Locations', {'fields': ('pickup_location', 'dropoff_location', 'pickup_latitude', 'pickup_longitude', 'dropoff_latitude', 'dropoff_longitude')}),
        ('Ride Details', {'fields': ('scheduled_datetime', 'vehicle_type', 'fuel_type', 'trip_type', 'estimated_fare')}),
    )
    
    actions = ['accept_requests', 'reject_requests']
    
    def accept_requests(self, request, queryset):
        queryset.update(status='accepted')
        self.message_user(request, f"{queryset.count()} ride requests have been accepted.")
    accept_requests.short_description = "Accept selected ride requests"
    
    def reject_requests(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f"{queryset.count()} ride requests have been rejected.")
    reject_requests.short_description = "Reject selected ride requests"

@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'driver', 'status', 'pickup_location', 'dropoff_location', 'created_at')
    list_filter = ('status', 'vehicle_type', 'fuel_type', 'trip_type', 'created_at')
    search_fields = ('pickup_location', 'dropoff_location', 'client_useremail', 'driveruser_email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Ride Details', {'fields': ('client', 'driver', 'status', 'created_at', 'updated_at')}),
        ('Locations', {'fields': ('pickup_location', 'dropoff_location', 'pickup_latitude', 'pickup_longitude', 'dropoff_latitude', 'dropoff_longitude')}),
        ('Ride Information', {'fields': ('request', 'scheduled_datetime', 'vehicle_type', 'fuel_type', 'trip_type', 'fare')}),
    )
    
    actions = ['complete_rides', 'cancel_rides']
    
    def complete_rides(self, request, queryset):
        queryset.update(status='completed')
        self.message_user(request, f"{queryset.count()} rides have been marked as completed.")
    complete_rides.short_description = "Mark selected rides as completed"
    
    def cancel_rides(self, request, queryset):
        queryset.update(status='cancelled')
        self.message_user(request, f"{queryset.count()} rides have been cancelled.")
    cancel_rides.short_description = "Cancel selected rides"

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'ride', 'client', 'amount', 'payment_method', 'status', 'created_at')
    list_filter = ('payment_method', 'status', 'created_at')
    search_fields = ('ride_id', 'amount', 'clientuser_email')
    readonly_fields = ('created_at', 'updated_at', 'processed_at')
    
    fieldsets = (
        ('Payment Details', {'fields': ('ride', 'client', 'driver', 'amount', 'payment_method', 'transaction_id', 'created_at', 'updated_at')}),
        ('Status', {'fields': ('status', 'processed_at')}),
        ('Financial Details', {'fields': ('commission', 'driver_amount')}),
    )
    
    actions = ['mark_as_completed', 'mark_as_failed', 'mark_as_processing']
    
    def mark_as_completed(self, request, queryset):
        queryset.update(status='completed', processed_at=timezone.now())
        self.message_user(request, f"{queryset.count()} payments have been marked as completed.")
    mark_as_completed.short_description = "Mark selected payments as completed"
    
    def mark_as_failed(self, request, queryset):
        queryset.update(status='failed', processed_at=timezone.now())
        self.message_user(request, f"{queryset.count()} payments have been marked as failed.")
    mark_as_failed.short_description = "Mark selected payments as failed"
    
    def mark_as_processing(self, request, queryset):
        queryset.update(status='processing')
        self.message_user(request, f"{queryset.count()} payments have been marked as processing.")
    mark_as_processing.short_description = "Mark selected payments as processing"

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'ride', 'client', 'driver', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('ride_id', 'clientuseremail', 'comment', 'driveruser_email')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Review Details', {'fields': ('ride', 'client', 'driver', 'rating', 'created_at')}),
        ('Comments', {'fields': ('comment',)}),
    )
    
    actions = ['export_reviews']
    
    def export_reviews(self, request, queryset):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reviews.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Client', 'Driver', 'Rating', 'Comment', 'Created At'])
        
        for review in queryset:
            writer.writerow([
                review.id,
                review.client.user.email,
                review.driver.user.email if review.driver else 'N/A',
                review.rating,
                review.comment or '',
                review.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    export_reviews.short_description = "Export selected reviews to CSV"

@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'otp', 'is_used', 'expires_at', 'created_at')
    list_filter = ('is_used', 'created_at')
    search_fields = ('email',)
    readonly_fields = ('created_at', 'expires_at')
    
    actions = ['mark_as_used', 'delete_expired']
    
    def mark_as_used(self, request, queryset):
        queryset.update(is_used=True)
        self.message_user(request, f"{queryset.count()} OTPs have been marked as used.")
    mark_as_used.short_description = "Mark selected OTPs as used"
    
    def delete_expired(self, request, queryset):
        expired_otps = queryset.filter(expires_at__lt=timezone.now())
        count = expired_otps.count()
        expired_otps.delete()
        self.message_user(request, f"{count} expired OTPs have been deleted.")
    delete_expired.short_description = "Delete expired OTPs"

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_notifications', 'push_notifications', 'sms_notifications', 'ride_updates', 'promotions')
    list_filter = ('email_notifications', 'push_notifications', 'sms_notifications', 'ride_updates', 'promotions')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(PushNotificationToken)
class PushNotificationTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_type', 'is_active', 'created_at')
    list_filter = ('device_type', 'is_active', 'created_at')
    search_fields = ('user__email', 'token')
    readonly_fields = ('created_at',)
    
    actions = ['activate_tokens', 'deactivate_tokens']
    
    def activate_tokens(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} tokens have been activated.")
    activate_tokens.short_description = "Activate selected tokens"
    
    def deactivate_tokens(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} tokens have been deactivated.")
    deactivate_tokens.short_description = "Deactivate selected tokens"

@admin.register(Cancellation)
class CancellationAdmin(admin.ModelAdmin):
    list_display = ('id', 'ride', 'cancelled_by', 'cancellation_fee', 'refund_amount', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('ride_id', 'cancelled_by_email')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Cancellation Details', {'fields': ('ride', 'cancelled_by', 'created_at')}),
        ('Financial Information', {'fields': ('cancellation_fee', 'refund_amount')}),
        ('Reason', {'fields': ('cancellation_reason',)}),
    )

@admin.register(Earning)
class EarningAdmin(admin.ModelAdmin):
    list_display = ('id', 'driver', 'ride', 'amount', 'net_amount', 'payment_status', 'created_at')
    list_filter = ('payment_status', 'created_at')
    search_fields = ('driver_useremail', 'ride_id')
    readonly_fields = ('created_at', 'paid_at')
    
    fieldsets = (
        ('Earning Details', {'fields': ('driver', 'ride', 'created_at', 'paid_at')}),
        ('Financial Information', {'fields': ('amount', 'commission', 'net_amount', 'payment_status')}),
    )
    
    actions = ['mark_as_paid']
    
    def mark_as_paid(self, request, queryset):
        queryset.update(payment_status='paid', paid_at=timezone.now())
        self.message_user(request, f"{queryset.count()} earnings have been marked as paid.")
    mark_as_paid.short_description = "Mark selected earnings as paid"