from rest_framework import serializers
from .models import (
    User, DriverProfile, ClientProfile, Ride, Payment, Review, 
    NotificationPreference, PushNotificationToken, RideRequest, 
    Cancellation, Earning
)
from decimal import Decimal, InvalidOperation
import os
import re
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_client', 'is_driver', 'is_active', 'date_joined']
        read_only_fields = ['id', 'is_active', 'date_joined']

class PhoneNumberField(serializers.CharField):
    """Custom phone number field that formats and validates phone numbers"""
    
    def to_internal_value(self, data):
        if not data:
            return ""
        
        # Remove all non-digit characters except +
        phone_number = re.sub(r'[^\d+]', '', str(data))
        
        # Handle Pakistani numbers specifically
        if phone_number.startswith('+92'):
            digits_only = phone_number[3:]
        elif phone_number.startswith('92'):
            digits_only = phone_number[2:]
        elif phone_number.startswith('0'):
            digits_only = phone_number[1:]
        else:
            digits_only = phone_number
        
        # Validate length (Pakistani mobile numbers are typically 10 digits after country code)
        if len(digits_only) < 10 or len(digits_only) > 11:
            raise serializers.ValidationError("Invalid Pakistani phone number format")
        
        # Return in standard format
        return f"+92{digits_only}"
    
    def to_representation(self, value):
        if not value:
            return ""
        return str(value)

class ClientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    phone_number = PhoneNumberField(required=False, allow_blank=True)
    
    # Custom field to return full URL for profile image
    dp_url = serializers.SerializerMethodField()
    
    # Add fields for backward compatibility and field mapping
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Add direct fields for frontend compatibility
    full_name = serializers.CharField(required=False, allow_blank=True)
    phone_number_direct = serializers.CharField(write_only=True, required=False, allow_blank=True, source='phone_number')
    
    class Meta:
        model = ClientProfile
        fields = [
            'id', 'user', 'full_name', 'cnic', 'age', 'phone_number',
            'address', 'dp', 'latitude', 'longitude', 'last_location_update', 
            'dp_url', 'name', 'phone', 'phone_number_direct'
        ]
        read_only_fields = ['id', 'user', 'last_location_update']
    
    def get_dp_url(self, obj):
        request = self.context.get('request')
        dp = obj.dp
        
        if dp and hasattr(dp, 'name') and dp.name:
            dp_url = dp.url
            if dp_url:
                if dp_url.startswith('http'):
                    return dp_url
                if request:
                    return request.build_absolute_uri(dp_url)
                return dp_url
        
        # Return default image URL if no image is set
        return f"{settings.MEDIA_URL}profile_pics/default_client.png"
    
    def validate_age(self, value):
        if value is not None:
            if isinstance(value, str):
                try:
                    value = int(value)
                except (ValueError, TypeError):
                    raise serializers.ValidationError("Age must be a valid number")
            
            if value < 18 or value > 100:
                raise serializers.ValidationError("Age must be between 18 and 100")
        return value
    
    def validate_cnic(self, value):
        if value:
            # Remove hyphens for validation
            cnic_digits = re.sub(r'[^\d]', '', str(value))
            if len(cnic_digits) != 13:
                raise serializers.ValidationError("CNIC must be exactly 13 digits")
        return value
    
    def validate(self, data):
        # Handle field mapping from frontend (backward compatibility)
        if 'name' in data and data['name']:
            data['full_name'] = data['name']
        
        if 'phone' in data and data['phone']:
            data['phone_number'] = data['phone']
        
        # Handle direct field mapping from frontend
        if 'full_name' in data and data['full_name']:
            # Ensure we don't overwrite with empty value
            pass  # Already mapped directly
        
        if 'phone_number_direct' in data and data['phone_number_direct']:
            data['phone_number'] = data['phone_number_direct']
        
        # Handle coordinate validation
        if 'latitude' in data and data['latitude'] is not None:
            try:
                lat = Decimal(str(data['latitude']))
                if lat < -90 or lat > 90:
                    raise serializers.ValidationError("Invalid latitude value")
                data['latitude'] = lat
            except (InvalidOperation, TypeError, ValueError):
                raise serializers.ValidationError("Invalid latitude format")
        
        if 'longitude' in data and data['longitude'] is not None:
            try:
                lng = Decimal(str(data['longitude']))
                if lng < -180 or lng > 180:
                    raise serializers.ValidationError("Invalid longitude value")
                data['longitude'] = lng
            except (InvalidOperation, TypeError, ValueError):
                raise serializers.ValidationError("Invalid longitude format")
        
        return data

class DriverProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    phone_number = PhoneNumberField(required=False, allow_blank=True)
    
    # Custom field to return full URL for profile image
    dp_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DriverProfile
        fields = [
            'id', 'user', 'full_name', 'cnic', 'age', 'driving_license',
            'license_expiry', 'phone_number', 'city', 'status', 'dp',
            'current_latitude', 'current_longitude', 'last_location_update', 'dp_url',
            # Bank account fields
            'bank_account_type', 'bank_account_number', 'bank_account_holder', 
            'bank_name', 'bank_account_verified',
            # Verification fields
            'cnic_verified', 'phone_verified', 'license_verified', 'city_verified'
        ]
        read_only_fields = ['id', 'user', 'last_location_update']
    
    def get_dp_url(self, obj):
        request = self.context.get('request')
        dp = obj.dp
        
        if dp and hasattr(dp, 'name') and dp.name:
            dp_url = dp.url
            if dp_url:
                if dp_url.startswith('http'):
                    return dp_url
                if request:
                    return request.build_absolute_uri(dp_url)
                return dp_url
        
        # Return default image URL if no image is set
        return f"{settings.MEDIA_URL}profile_pics/default_driver.png"
    
    def validate_age(self, value):
        if value is not None:
            if isinstance(value, str):
                try:
                    value = int(value)
                except (ValueError, TypeError):
                    raise serializers.ValidationError("Age must be a valid number")
            
            if value < 18 or value > 100:
                raise serializers.ValidationError("Age must be between 18 and 100")
        return value
    
    def validate_license_expiry(self, value):
        if value is not None:
            from datetime import date
            if value < date.today():
                raise serializers.ValidationError("License expiry date must be in the future")
        return value

class RideRequestSerializer(serializers.ModelSerializer):
    client = ClientProfileSerializer(read_only=True)
    
    class Meta:
        model = RideRequest
        fields = [
            'id', 'client', 'pickup_location', 'dropoff_location',
            'pickup_latitude', 'pickup_longitude', 'dropoff_latitude', 'dropoff_longitude',
            'scheduled_datetime', 'vehicle_type', 'fuel_type', 'trip_type', 
            'estimated_fare', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Ensure datetime fields are properly formatted
        if instance.scheduled_datetime:
            representation['scheduled_datetime'] = instance.scheduled_datetime.isoformat()
        
        if instance.created_at:
            representation['created_at'] = instance.created_at.isoformat()
            
        if instance.updated_at:
            representation['updated_at'] = instance.updated_at.isoformat()
            
        # Ensure numeric fields are strings to prevent type errors
        if instance.pickup_latitude is not None:
            representation['pickup_latitude'] = str(instance.pickup_latitude)
            
        if instance.pickup_longitude is not None:
            representation['pickup_longitude'] = str(instance.pickup_longitude)
            
        if instance.dropoff_latitude is not None:
            representation['dropoff_latitude'] = str(instance.dropoff_latitude)
            
        if instance.dropoff_longitude is not None:
            representation['dropoff_longitude'] = str(instance.dropoff_longitude)
            
        if instance.estimated_fare is not None:
            representation['estimated_fare'] = str(instance.estimated_fare)
            
        return representation

class RideSerializer(serializers.ModelSerializer):
    # Remove request_id and ride_id fields if they exist
    client = ClientProfileSerializer(read_only=True)
    driver = DriverProfileSerializer(read_only=True)
    
    class Meta:
        model = Ride
        fields = [
            'id',  # Use 'id' instead of 'ride_id'
            'request', 
            'client', 
            'driver', 
            'pickup_location', 
            'dropoff_location',
            'pickup_latitude', 
            'pickup_longitude',
            'dropoff_latitude', 
            'dropoff_longitude',
            'scheduled_datetime', 
            'vehicle_type', 
            'fuel_type', 
            'trip_type', 
            'fare', 
            'status',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class PaymentSerializer(serializers.ModelSerializer):
    ride = RideSerializer(read_only=True)
    client = ClientProfileSerializer(read_only=True)
    driver = DriverProfileSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id',  # Changed from payment_id
            'ride', 
            'client',  
            'driver',
            'amount', 
            'payment_method',  # Changed from method to match model
            'transaction_id',
            'status',
            'created_at',  # Changed from payment_date to match model
            'processed_at'
        ]
        read_only_fields = ['id', 'created_at', 'processed_at']

class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('ride', 'amount', 'payment_method', 'transaction_id')
    
    def create(self, validated_data):
        # Get ride details to set client and driver
        ride = validated_data['ride']
        validated_data['client'] = ride.client
        validated_data['driver'] = ride.driver
        
        return super().create(validated_data)

class ReviewSerializer(serializers.ModelSerializer):
    ride = RideSerializer(read_only=True)
    client = ClientProfileSerializer(read_only=True)
    driver = DriverProfileSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id',  # Changed from review_id to match model
            'ride', 'client', 'driver', 'rating', 
            'comment',  # Changed from comments to match model
            'created_at'  # Changed from review_date to match model
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

class CancellationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cancellation
        fields = ['id', 'ride', 'cancelled_by', 'cancellation_reason', 'cancellation_fee', 'refund_amount', 'created_at']
        read_only_fields = ['id', 'cancelled_by', 'created_at']
    
    def validate_cancellation_fee(self, value):
        if value < 0:
            raise serializers.ValidationError("Cancellation fee cannot be negative")
        return value
    
    def validate_refund_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Refund amount cannot be negative")
        return value

class EarningSerializer(serializers.ModelSerializer):
    driver = DriverProfileSerializer(read_only=True)
    ride = RideSerializer(read_only=True)
    
    class Meta:
        model = Earning
        fields = [
            'id', 'driver', 'ride', 'amount', 'commission', 'net_amount',
            'payment_status', 'created_at', 'paid_at'
        ]
        read_only_fields = ['id', 'driver', 'ride', 'created_at', 'paid_at']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def validate_commission(self, value):
        if value < 0:
            raise serializers.ValidationError("Commission cannot be negative")
        return value
    
    def validate_net_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Net amount must be greater than zero")
        return value
    
    def validate(self, data):
        # Validate that net amount equals amount minus commission
        if 'amount' in data and 'commission' in data and 'net_amount' in data:
            calculated_net = data['amount'] - data['commission']
            if abs(calculated_net - data['net_amount']) > Decimal('0.01'):
                raise serializers.ValidationError("Net amount must equal amount minus commission")
        return data

class RideStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating ride status"""
    class Meta:
        model = Ride
        fields = ['status']

class DriverEarningsSummarySerializer(serializers.Serializer):
    """Serializer for driver earnings summary"""
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    earnings_by_date = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
    recent_payments = PaymentSerializer(many=True, read_only=True)

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""
    class Meta:
        model = NotificationPreference
        fields = '_all_'

class PushNotificationTokenSerializer(serializers.ModelSerializer):
    """Serializer for push notification tokens"""
    class Meta:
        model = PushNotificationToken
        fields = '_all_'

class AdminDashboardStatsSerializer(serializers.Serializer):
    """Serializer for admin dashboard statistics"""
    total_users = serializers.IntegerField()
    total_drivers = serializers.IntegerField()
    total_clients = serializers.IntegerField()
    total_rides = serializers.IntegerField()
    completed_rides = serializers.IntegerField()
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_drivers = serializers.IntegerField()

class AdminDriverApprovalSerializer(serializers.ModelSerializer):
    """Serializer for admin driver approval"""
    class Meta:
        model = DriverProfile
        fields = ['id', 'user', 'full_name', 'status']

class SystemHealthSerializer(serializers.Serializer):
    """Serializer for system health check"""
    status = serializers.CharField()
    database = serializers.CharField()
    version = serializers.CharField()
    environment = serializers.CharField()