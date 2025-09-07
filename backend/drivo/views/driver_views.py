from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
import re
from datetime import datetime
from decimal import Decimal
from ..models import (
    User, DriverProfile, Ride, Payment, RideRequest
)
from ..serializers import (
    DriverProfileSerializer, RideSerializer, PaymentSerializer, RideRequestSerializer
)

# ------------------- DRIVER PROFILE VIEW -------------------
class DriverProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        if not request.user.is_driver:
            return Response(
                {"error": "User is not a driver. Please switch to driver mode."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        profile, created = DriverProfile.objects.get_or_create(user=request.user, defaults={
            'full_name': '',
            'age': None,
            'cnic': '',
            'driving_license': '',
            'license_expiry': None,
            'phone_number': '',
            'city': '',
            'status': 'available'
        })
        
        serializer = DriverProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=200)
    
    def put(self, request):
        if not request.user.is_driver:
            return Response(
                {"error": "User is not a driver. Please switch to driver mode."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        profile, created = DriverProfile.objects.get_or_create(user=request.user, defaults={
            'full_name': '',
            'age': None,
            'cnic': '',
            'driving_license': '',
            'license_expiry': None,
            'phone_number': '',
            'city': '',
            'status': 'available'
        })
        
        data = request.data.copy()
        
        # Basic information
        if 'full_name' in data:
            profile.full_name = data['full_name']
        if 'cnic' in data:
            profile.cnic = data['cnic']
        if 'age' in data and data['age']:
            try:
                profile.age = int(data['age'])
            except (ValueError, TypeError):
                profile.age = None
        if 'phone_number' in data:
            phone_number = re.sub(r'[^\d]', '', str(data['phone_number']))
            if 10 <= len(phone_number) <= 15:
                profile.phone_number = phone_number
        if 'address' in data:
            profile.address = data['address']
        
        # Driver license information
        if 'driving_license' in data:
            profile.driving_license = data['driving_license']
        if 'license_expiry' in data and data['license_expiry']:
            try:
                profile.license_expiry = datetime.strptime(data['license_expiry'], '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"error": "Invalid license expiry date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Bank account information
        if 'bank_account_type' in data:
            profile.bank_account_type = data['bank_account_type']
        if 'bank_account_number' in data:
            profile.bank_account_number = data['bank_account_number']
        if 'bank_account_holder' in data:
            profile.bank_account_holder = data['bank_account_holder']
        if 'bank_name' in data:
            profile.bank_name = data['bank_name']
        
        # City field
        if 'city' in data:
            profile.city = data['city']
        
        # Profile image
        if 'dp' in request.FILES:
            profile.dp = request.FILES['dp']
        
        # Save the profile
        profile.save()
        
        serializer = DriverProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=200)
    
    def post(self, request):
        # Handle POST requests the same way as PUT
        return self.put(request)

# ------------------- UPDATE DRIVER LOCATION VIEW -------------------
class UpdateDriverLocationView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def patch(self, request):
        try:
            profile = DriverProfile.objects.get(user=request.user)
            profile.current_latitude = request.data.get('current_latitude')
            profile.current_longitude = request.data.get('current_longitude')
            profile.save()
            return Response(
                {"success": True, "message": "Location updated successfully"},
                status=status.HTTP_200_OK
            )
        except DriverProfile.DoesNotExist:
            return Response(
                {"success": False, "error": "Driver profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

# ------------------- DRIVER RIDE REQUESTS VIEW -------------------
class DriverRideRequestsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = RideRequestSerializer
    
    def get_queryset(self):
        return RideRequest.objects.filter(status='pending').order_by('-created_at')

# ------------------- DRIVER CURRENT RIDE VIEW -------------------
class DriverCurrentRideView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = RideSerializer
    
    def get_object(self):
        try:
            driver_profile = DriverProfile.objects.get(user=self.request.user)
            return Ride.objects.get(driver=driver_profile, status='in_progress')
        except (DriverProfile.DoesNotExist, Ride.DoesNotExist):
            return None

# ------------------- DRIVER RIDE HISTORY VIEW -------------------
class DriverRideHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = RideSerializer
    
    def get_queryset(self):
        try:
            driver_profile = DriverProfile.objects.get(user=self.request.user)
            return Ride.objects.filter(driver=driver_profile).order_by('-created_at')
        except DriverProfile.DoesNotExist:
            return Ride.objects.none()

# ------------------- DRIVER EARNINGS VIEW -------------------
class DriverEarningsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        driver_profile = DriverProfile.objects.get(user=self.request.user)
        return Payment.objects.filter(ride__driver=driver_profile, status='completed')
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        total_earnings = sum(payment.amount for payment in queryset)
        
        earnings_by_date = {}
        for payment in queryset:
            date = payment.created_at.date()
            if date not in earnings_by_date:
                earnings_by_date[date] = 0
            earnings_by_date[date] += payment.amount
        
        response_data = {
            'total_earnings': total_earnings,
            'earnings_by_date': [
                {'date': date.strftime('%Y-%m-%d'), 'amount': amount} 
                for date, amount in earnings_by_date.items()
            ],
            'recent_payments': PaymentSerializer(queryset[:10], many=True).data
        }
        
        return Response(response_data)

# ------------------- DRIVER RESPOND TO RIDE VIEW -------------------
class DriverRespondToRideView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request, request_id):
        return self._respond_to_ride(request, request_id)
    
    def patch(self, request, request_id):
        return self._respond_to_ride(request, request_id)
    
    def _respond_to_ride(self, request, request_id):
        try:
            ride_request = RideRequest.objects.get(id=request_id)
        except RideRequest.DoesNotExist:
            return Response(
                {"error": "Ride request not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            driver_profile = DriverProfile.objects.get(user=request.user)
        except DriverProfile.DoesNotExist:
            return Response(
                {"error": "Driver profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if driver is available OR offline (allow offline drivers to accept rides)
        if driver_profile.status not in ['available', 'offline']:
            return Response(
                {"error": f"Driver is not available (current status: {driver_profile.status})"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if ride_request.status != 'pending':
            return Response(
                {"error": "Ride request is no longer pending"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Accept either 'response' or 'action' from the frontend
        response = request.data.get('response') or request.data.get('action')
        
        # DEBUG: Log the request data
        print(f"Request data: {request.data}")
        print(f"Response value: {response}")
        
        # More flexible response validation
        if not response:
            return Response(
                {"error": "Response parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Normalize response values
        is_accept = response.lower() in ['accept', 'accepted']
        is_reject = response.lower() in ['reject', 'rejected']
        
        if not (is_accept or is_reject):
            return Response(
                {"error": "Response must be either 'accept' or 'reject'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if is_accept:
            ride_request.status = 'accepted'
            
            ride_data = {
                'client': ride_request.client,
                'driver': driver_profile,
                'pickup_location': ride_request.pickup_location,
                'dropoff_location': ride_request.dropoff_location,
                'pickup_latitude': ride_request.pickup_latitude,
                'pickup_longitude': ride_request.pickup_longitude,
                'dropoff_latitude': ride_request.dropoff_latitude,
                'dropoff_longitude': ride_request.dropoff_longitude,
                'scheduled_datetime': ride_request.scheduled_datetime,
                'vehicle_type': ride_request.vehicle_type,
                'fuel_type': ride_request.fuel_type,
                'trip_type': ride_request.trip_type,
                'fare': ride_request.estimated_fare,
                'status': 'accepted'
            }
            
            ride = Ride.objects.create(**ride_data)
            
            # Set driver status to 'busy' only when accepting a ride
            driver_profile.status = 'busy'
            driver_profile.save()
            
            message = "Ride request accepted successfully"
            ride_id = ride.id
        else:
            ride_request.status = 'rejected'
            # If driver was offline and rejected, keep them offline
            if driver_profile.status == 'offline':
                driver_profile.status = 'offline'
            else:
                driver_profile.status = 'available'
            driver_profile.save()
            message = "Ride request rejected successfully"
            ride_id = None
        
        ride_request.save()
        
        serializer = RideRequestSerializer(ride_request)
        response_data = {
            'success': True,
            'message': message,
            'ride_request': serializer.data
        }
        
        if ride_id:
            response_data['ride_id'] = ride_id
        
        return Response(response_data, status=status.HTTP_200_OK)

# ------------------- ASSIGN DRIVER TO RIDE VIEW -------------------
class AssignDriverToRideView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def patch(self, request, request_id):
        try:
            ride_request = RideRequest.objects.get(id=request_id)
        except RideRequest.DoesNotExist:
            return Response(
                {"error": "Ride request not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        driver_id = request.data.get('driver_id')
        if not driver_id:
            return Response(
                {"error": "Driver ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            driver_profile = DriverProfile.objects.get(id=driver_id)
        except DriverProfile.DoesNotExist:
            return Response(
                {"error": "Driver profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if driver_profile.status != 'available':
            return Response(
                {"error": "Driver is not available"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if ride_request.status != 'pending':
            return Response(
                {"error": "Ride request is no longer pending"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ride_data = {
            'client': ride_request.client,
            'driver': driver_profile,
            'pickup_location': ride_request.pickup_location,
            'dropoff_location': ride_request.dropoff_location,
            'pickup_latitude': ride_request.pickup_latitude,
            'pickup_longitude': ride_request.pickup_longitude,
            'dropoff_latitude': ride_request.dropoff_latitude,
            'dropoff_longitude': ride_request.dropoff_longitude,
            'scheduled_datetime': ride_request.scheduled_datetime,
            'vehicle_type': ride_request.vehicle_type,
            'fuel_type': ride_request.fuel_type,
            'trip_type': ride_request.trip_type,
            'fare': ride_request.estimated_fare,
            'status': 'in_progress'
        }
        
        try:
            ride = Ride.objects.create(**ride_data)
            
            ride_request.status = 'accepted'
            ride_request.save()
            
            driver_profile.status = 'busy'
            driver_profile.save()
            
            serializer = RideSerializer(ride)
            return Response({
                'success': True,
                'message': 'Driver assigned successfully',
                'ride': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error creating ride: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "Failed to assign driver", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

# ------------------- RESET DRIVER STATUS VIEW -------------------
class ResetDriverStatusView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request):
        try:
            driver_profile = DriverProfile.objects.get(user=request.user)
            status = request.data.get('status', 'available')
            
            if status not in ['available', 'offline', 'busy']:
                return Response(
                    {"error": "Invalid status. Must be 'available', 'offline', or 'busy'"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            driver_profile.status = status
            driver_profile.save()
            
            return Response({
                "success": True,
                "message": f"Driver status updated to {status}",
                "status": status
            }, status=status.HTTP_200_OK)
            
        except DriverProfile.DoesNotExist:
            return Response(
                {"error": "Driver profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

# ------------------- AVAILABLE DRIVERS VIEW -------------------
class AvailableDriversView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = DriverProfileSerializer
    
    def get_queryset(self):
        # Only return drivers that are available and have complete profiles
        return DriverProfile.objects.filter(
            status='available',
            user__is_driver=True,
            user__is_active=True
        ).exclude(
            full_name=''
        ).exclude(
            current_latitude__isnull=True,
            current_longitude__isnull=True
        ).order_by('-created_at')

# ------------------- DRIVER PROFILES VIEW -------------------
class DriverProfilesView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = DriverProfileSerializer
    
    def get_queryset(self):
        # Return all active drivers with complete profiles
        return DriverProfile.objects.filter(
            user__is_driver=True,
            user__is_active=True
        ).exclude(
            full_name=''
        ).order_by('-created_at')

# ------------------- DRIVER PROFILE DETAIL VIEW (FIXED) -------------------
class DriverProfileDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = DriverProfileSerializer
    lookup_field = 'id'  # This tells DRF to use the 'id' field for lookups
    
    def get_object(self):
        try:
            # FIXED: Use 'pk' instead of 'id' to match the URL parameter
            obj = DriverProfile.objects.get(id=self.kwargs['pk'])
            # Check if this is actually a driver
            if not obj.user.is_driver:
                raise NotFound("User is not a driver")
            return obj
        except DriverProfile.DoesNotExist:
            raise NotFound("Driver profile not found")

# ------------------- FIX DRIVER DATA VIEW -------------------
class FixDriverDataView(APIView):
    def post(self, request):
        # Fix user types
        drivers = DriverProfile.objects.all()
        fixed_count = 0
        
        for driver in drivers:
            if driver.user and not driver.user.is_driver:
                driver.user.is_driver = True
                driver.user.is_client = False
                driver.user.save()
                fixed_count += 1
        
        # Add default names
        nameless_drivers = DriverProfile.objects.filter(full_name='')
        for driver in nameless_drivers:
            if driver.user and driver.user.email:
                driver.full_name = driver.user.email.split('@')[0]
            else:
                driver.full_name = f"Driver {driver.id}"
            driver.save()
            fixed_count += 1
        
        return Response({
            "success": True,
            "message": f"Fixed {fixed_count} driver profiles"
        })