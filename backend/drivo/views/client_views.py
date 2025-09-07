from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
import re 
from drivo.models import DriverProfile, ClientProfile, Ride, Payment, Review, RideRequest
from drivo.serializers import (
    ClientProfileSerializer, DriverProfileSerializer, RideSerializer, PaymentSerializer, 
    PaymentCreateSerializer, ReviewSerializer, RideRequestSerializer
)
from decimal import Decimal
from datetime import datetime
from django.utils import timezone

# ------------------- CLIENT PROFILE VIEW -------------------
class ClientProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        if not request.user.is_client:
            return Response(
                {"error": "User is not a client. Please switch to client mode."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        profile, created = ClientProfile.objects.get_or_create(user=request.user, defaults={
            'full_name': '',
            'age': None,
            'cnic': '',
            'phone_number': '',
            'address': ''
        })
        
        serializer = ClientProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=200)
    
    def post(self, request):
        return self._update_profile(request, status.HTTP_201_CREATED)
    
    def put(self, request):
        return self._update_profile(request, status.HTTP_200_OK)
    
    def _update_profile(self, request, success_status):
        if not request.user.is_client:
            return Response(
                {"error": "User is not a client. Please switch to client mode."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        profile, created = ClientProfile.objects.get_or_create(user=request.user, defaults={
            'full_name': '',
            'age': None,
            'cnic': '',
            'phone_number': '',
            'address': ''
        })
        
        print("=== CLIENT PROFILE UPDATE DEBUG ===")
        print("Request data:", request.data)
        print("Request files:", request.FILES)
        
        # Use the serializer for validation
        serializer = ClientProfileSerializer(
            profile, 
            data=request.data, 
            context={'request': request}, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            print("=== SAVED PROFILE DATA ===")
            print(f"Profile data: {serializer.data}")
            return Response(serializer.data, status=success_status)
        else:
            print("=== VALIDATION ERRORS ===")
            print(f"Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ------------------- UPDATE CLIENT LOCATION VIEW -------------------
class UpdateClientLocationView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def patch(self, request):
        try:
            profile = ClientProfile.objects.get(user=request.user)
            profile.latitude = request.data.get('latitude')
            profile.longitude = request.data.get('longitude')
            profile.save()
            return Response(
                {"success": True, "message": "Location updated successfully"},
                status=status.HTTP_200_OK
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"success": False, "error": "Client profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

# ------------------- SAVE LOCATION VIEW -------------------
class SaveLocationView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request):
        user = request.user
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        print("=== SAVE LOCATION DEBUG ===")
        print(f"User: {user.email}")
        print(f"Is client: {user.is_client}")
        print(f"Is driver: {user.is_driver}")
        print(f"Raw latitude: {latitude} (type: {type(latitude)})")
        print(f"Raw longitude: {longitude} (type: {type(longitude)})")
        
        if latitude is None or longitude is None:
            return Response(
                {"error": "Both latitude and longitude are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat_decimal = Decimal(str(latitude))
            lon_decimal = Decimal(str(longitude))
            
            print(f"Converted latitude: {lat_decimal} (type: {type(lat_decimal)})")
            print(f"Converted longitude: {lon_decimal} (type: {type(lon_decimal)})")
            
            if getattr(user, 'is_client', False):
                profile, created = ClientProfile.objects.get_or_create(user=user)
                print(f"Client profile {'created' if created else 'retrieved'}")
                print(f"Profile ID: {profile.id}")
                print(f"Before update - lat: {profile.latitude}, lon: {profile.longitude}")
                
                profile.latitude = lat_decimal
                profile.longitude = lon_decimal
                profile.save()
                
                print(f"After save - lat: {profile.latitude}, lon: {profile.longitude}")
                
                profile.refresh_from_db()
                print(f"After refresh - lat: {profile.latitude}, lon: {profile.longitude}")
                
            elif getattr(user, 'is_driver', False):
                profile, _ = DriverProfile.objects.get_or_create(user=user)
                profile.current_latitude = lat_decimal
                profile.current_longitude = lon_decimal
                profile.save()
                
                profile.refresh_from_db()
                print(f"Driver location saved - lat: {profile.current_latitude}, lon: {profile.current_longitude}")
                
            else:
                return Response(
                    {"error": "User has no associated profile."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(
                {"success": "Location saved successfully."}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            print(f"Error saving location: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to save location: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ------------------- GET CURRENT LOCATION VIEW -------------------
class GetCurrentLocationView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        user = request.user
        
        if getattr(user, 'is_client', False):
            try:
                profile = ClientProfile.objects.get(user=user)
                if profile.latitude is not None and profile.longitude is not None:
                    return Response({
                        "latitude": profile.latitude,
                        "longitude": profile.longitude,
                        "last_updated": None
                    }, status=status.HTTP_200_OK)
                else:
                    return Response(
                        {"error": "No location data available for this user."}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            except ClientProfile.DoesNotExist:
                return Response(
                    {"error": "Client profile not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif getattr(user, 'is_driver', False):
            try:
                profile = DriverProfile.objects.get(user=user)
                if profile.current_latitude is not None and profile.current_longitude is not None:
                    return Response({
                        "latitude": profile.current_latitude,
                        "longitude": profile.current_longitude,
                        "last_updated": profile.last_location_update
                    }, status=status.HTTP_200_OK)
                else:
                    return Response(
                        {"error": "No location data available for this user."}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            except DriverProfile.DoesNotExist:
                return Response(
                    {"error": "Driver profile not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {"error": "User has no associated profile."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# ------------------- CLIENT RIDE HISTORY VIEW -------------------
class ClientRideHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = RideSerializer
    
    def get_queryset(self):
        try:
            client_profile = ClientProfile.objects.get(user=self.request.user)
            return Ride.objects.filter(client=client_profile).order_by('-created_at')
        except ClientProfile.DoesNotExist:
            return Ride.objects.none()

# ------------------- RIDE REQUEST VIEW -------------------
class RideRequestView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request):
        print("=== RIDE REQUEST DEBUG ===")
        print("User:", request.user.email)
        print("Request data:", request.data)
        
        if not request.user.is_client:
            return Response(
                {"error": "Only clients can create ride requests"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            client_profile = ClientProfile.objects.get(user=request.user)
        except ClientProfile.DoesNotExist:
            client_profile = ClientProfile.objects.create(
                user=request.user,
                full_name=request.user.email.split('@')[0]
            )
        
        scheduled_datetime_str = request.data.get('scheduled_datetime')
        scheduled_datetime = None
        if scheduled_datetime_str:
            try:
                if 'T' in scheduled_datetime_str:
                    if '+' in scheduled_datetime_str or '-' in scheduled_datetime_str[-6:]:
                        scheduled_datetime = datetime.fromisoformat(scheduled_datetime_str)
                    else:
                        naive_datetime = datetime.strptime(scheduled_datetime_str.split('.')[0], '%Y-%m-%dT%H:%M:%S')
                        scheduled_datetime = timezone.make_aware(naive_datetime)
                else:
                    naive_datetime = datetime.strptime(scheduled_datetime_str, '%Y-%m-%d %H:%M')
                    scheduled_datetime = timezone.make_aware(naive_datetime)
            except (ValueError, TypeError) as e:
                print(f"Error parsing datetime: {e}")
        
        ride_request_data = {
            'client': client_profile,
            'pickup_location': request.data.get('pickup_location'),
            'dropoff_location': request.data.get('dropoff_location'),
            'pickup_latitude': request.data.get('pickup_latitude'),
            'pickup_longitude': request.data.get('pickup_longitude'),
            'dropoff_latitude': request.data.get('dropoff_latitude'),
            'dropoff_longitude': request.data.get('dropoff_longitude'),
            'scheduled_datetime': scheduled_datetime,
            'vehicle_type': request.data.get('vehicle_type'),
            'fuel_type': request.data.get('fuel_type'),
            'trip_type': request.data.get('trip_type'),
            'estimated_fare': request.data.get('estimated_fare'),
        }
        
        if ride_request_data['fuel_type'] == "Petrol":
            ride_request_data['fuel_type'] = "petrol"
        elif ride_request_data['fuel_type'] == "Diesel":
            ride_request_data['fuel_type'] = "diesel"
        elif ride_request_data['fuel_type'] == "CNG":
            ride_request_data['fuel_type'] = "cng"
        elif ride_request_data['fuel_type'] == "Electric":
            ride_request_data['fuel_type'] = "electric"
        elif ride_request_data['fuel_type'] == "Hybrid":
            ride_request_data['fuel_type'] = "hybrid"
            
        # FIXED: Changed trip_type conversion to use underscores instead of hyphens
        if ride_request_data['trip_type'] == "1_way":
            ride_request_data['trip_type'] = "one_way"  # Changed from "one-way" to "one_way"
        elif ride_request_data['trip_type'] == "2_way":
            ride_request_data['trip_type'] = "two_way"  # Changed from "round-trip" to "two_way"
        elif ride_request_data['trip_type'] == "round_trip":
            ride_request_data['trip_type'] = "round_trip"  # Keep as is if this is a valid option
        
        try:
            ride_request = RideRequest(
                client=ride_request_data['client'],
                pickup_location=ride_request_data['pickup_location'],
                dropoff_location=ride_request_data['dropoff_location'],
                pickup_latitude=ride_request_data.get('pickup_latitude'),
                pickup_longitude=ride_request_data.get('pickup_longitude'),
                dropoff_latitude=ride_request_data.get('dropoff_latitude'),
                dropoff_longitude=ride_request_data.get('dropoff_longitude'),
                scheduled_datetime=ride_request_data.get('scheduled_datetime'),
                vehicle_type=ride_request_data['vehicle_type'],
                fuel_type=ride_request_data['fuel_type'],
                trip_type=ride_request_data['trip_type'],
                estimated_fare=ride_request_data.get('estimated_fare'),
            )
            
            ride_request.save()
            ride_request.refresh_from_db()
            
            response_data = {
                'id': ride_request.id,
                'client': {
                    'id': ride_request.client.id,
                    'full_name': ride_request.client.full_name or '',
                    'user': {
                        'id': ride_request.client.user.id,
                        'email': ride_request.client.user.email
                    }
                },
                'pickup_location': ride_request.pickup_location or '',
                'dropoff_location': ride_request.dropoff_location or '',
                'pickup_latitude': str(ride_request.pickup_latitude) if ride_request.pickup_latitude is not None else None,
                'pickup_longitude': str(ride_request.pickup_longitude) if ride_request.pickup_longitude is not None else None,
                'dropoff_latitude': str(ride_request.dropoff_latitude) if ride_request.dropoff_latitude is not None else None,
                'dropoff_longitude': str(ride_request.dropoff_longitude) if ride_request.dropoff_longitude is not None else None,
                'scheduled_datetime': ride_request.scheduled_datetime.isoformat() if ride_request.scheduled_datetime is not None else None,
                'vehicle_type': ride_request.vehicle_type or '',
                'fuel_type': ride_request.fuel_type or '',
                'trip_type': ride_request.trip_type or '',
                'estimated_fare': str(ride_request.estimated_fare) if ride_request.estimated_fare is not None else "0.00",
                'status': ride_request.status or '',
                'created_at': ride_request.created_at.isoformat() if ride_request.created_at is not None else None,
                'updated_at': ride_request.updated_at.isoformat() if ride_request.updated_at is not None else None,
            }
            
            return Response({
                'success': True,
                'message': 'Ride request created successfully',
                'ride_request': response_data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating ride request: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "Failed to create ride request", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

# ------------------- UPDATE RIDE REQUEST VIEW -------------------
class UpdateRideRequestView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def patch(self, request, pk):
        try:
            ride_request = RideRequest.objects.get(pk=pk)
            
            # Check if the user is the client who created the ride request
            if ride_request.client.user != request.user:
                return Response(
                    {"error": "You don't have permission to update this ride request"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update the ride request with route details
            if 'distance' in request.data:
                ride_request.distance = request.data['distance']
            if 'duration' in request.data:
                ride_request.duration = request.data['duration']
            if 'fare' in request.data:
                ride_request.estimated_fare = request.data['fare']
                
            ride_request.save()
            
            serializer = RideRequestSerializer(ride_request)
            return Response(serializer.data)
            
        except RideRequest.DoesNotExist:
            return Response(
                {"error": "Ride request not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ------------------- UPDATE RIDE REQUEST STATUS VIEW -------------------
class UpdateRideRequestStatusView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def patch(self, request, pk):
        try:
            ride_request = RideRequest.objects.get(pk=pk)
            
            # Check if the user is the client who created the ride request
            if ride_request.client.user != request.user:
                return Response(
                    {"error": "You don't have permission to update this ride request"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update the ride request status
            if 'status' in request.data:
                ride_request.status = request.data['status']
                ride_request.save()
            
            serializer = RideRequestSerializer(ride_request)
            return Response(serializer.data)
            
        except RideRequest.DoesNotExist:
            return Response(
                {"error": "Ride request not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ------------------- CONVERT RIDE REQUEST TO RIDE VIEW -------------------
class ConvertRideRequestToRideView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request, pk):
        try:
            ride_request = RideRequest.objects.get(pk=pk)
            
            # Check if the user is the client who created the ride request
            if ride_request.client.user != request.user:
                return Response(
                    {"error": "You don't have permission to convert this ride request"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Log the ride request data for debugging
            print("=== RIDE REQUEST DATA ===")
            print(f"Ride request ID: {ride_request.id}")
            print(f"Pickup location: {ride_request.pickup_location}")
            print(f"Dropoff location: {ride_request.dropoff_location}")
            print(f"Estimated fare: {ride_request.estimated_fare}")
            print(f"Distance: {getattr(ride_request, 'distance', 'Not available')}")
            print(f"Duration: {getattr(ride_request, 'duration', 'Not available')}")
            
            # Create a new ride from the ride request
            ride_data = {
                'client': ride_request.client,
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
                'status': 'requested'
            }
            
            # Add distance and duration if they exist on the ride request
            if hasattr(ride_request, 'distance') and ride_request.distance is not None:
                ride_data['distance'] = ride_request.distance
            
            if hasattr(ride_request, 'duration') and ride_request.duration is not None:
                ride_data['duration'] = ride_request.duration
            
            # Log the ride data for debugging
            print("=== RIDE DATA ===")
            print("Ride data:", ride_data)
            
            # Validate required fields
            if not ride_data['pickup_location'] or not ride_data['dropoff_location']:
                return Response(
                    {"error": "Pickup and dropoff locations are required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not ride_data['client']:
                return Response(
                    {"error": "Client is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the ride
            ride = Ride.objects.create(**ride_data)
            
            # Delete the ride request
            ride_request.delete()
            
            serializer = RideSerializer(ride)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except RideRequest.DoesNotExist:
            return Response(
                {"error": "Ride request not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print("=== RIDE CONVERSION ERROR ===")
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to convert ride request: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ------------------- CREATE RIDE REVIEW VIEW -------------------
class CreateRideReviewView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request, ride_id):
        try:
            ride = Ride.objects.get(id=ride_id)
            
            client_profile = ClientProfile.objects.get(user=request.user)
            if ride.client != client_profile:
                return Response(
                    {"error": "You can only review rides that you booked"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not ride.driver:
                return Response(
                    {"error": "Cannot review a ride without a driver"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if ride.status != 'completed':
                return Response(
                    {"error": "Can only review completed rides"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            existing_review = Review.objects.filter(
                ride=ride,
                client=client_profile,
                driver=ride.driver
            ).first()
            
            if existing_review:
                return Response(
                    {"error": "You have already reviewed this ride"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            rating = request.data.get('rating')
            comment = request.data.get('comment', '')
            
            if not rating:
                return Response(
                    {"error": "Rating is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    return Response(
                        {"error": "Rating must be between 1 and 5"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {"error": "Rating must be a number"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            review = Review.objects.create(
                ride=ride,
                client=client_profile,
                driver=ride.driver,
                rating=rating,
                comment=comment
            )
            
            serializer = ReviewSerializer(review)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Ride.DoesNotExist:
            return Response(
                {"error": "Ride not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error creating ride review: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ------------------- RIDE DETAIL VIEW -------------------
class RideDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request, pk):
        try:
            ride = Ride.objects.get(pk=pk)
            # Check if user is either the client or the driver of the ride
            if (request.user.is_client and ride.client.user == request.user) or \
               (request.user.is_driver and ride.driver and ride.driver.user == request.user):
                serializer = RideSerializer(ride)
                return Response(serializer.data)
            else:
                return Response(
                    {"error": "You don't have permission to view this ride"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Ride.DoesNotExist:
            return Response(
                {"error": "Ride not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request, pk):
        try:
            ride = Ride.objects.get(pk=pk)
            
            # Check if user is either the client or the driver of the ride
            if request.user.is_client and ride.client.user != request.user:
                return Response(
                    {"error": "You don't have permission to update this ride"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if request.user.is_driver and (not ride.driver or ride.driver.user != request.user):
                return Response(
                    {"error": "You don't have permission to update this ride"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update ride status
            if 'status' in request.data:
                ride.status = request.data['status']
                
                # If driver is completing a ride, set their status back to available
                if ride.status == 'completed' and ride.driver:
                    ride.driver.status = 'available'
                    ride.driver.save()
            
            ride.save()
            serializer = RideSerializer(ride)
            return Response(serializer.data)
            
        except Ride.DoesNotExist:
            return Response(
                {"error": "Ride not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

# ------------------- AVAILABLE DRIVERS VIEW -------------------
class AvailableDriversView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = DriverProfileSerializer
    
    def get_queryset(self):
        # Only return drivers that are available and have location data
        return DriverProfile.objects.filter(
            status='available',
            current_latitude__isnull=False,
            current_longitude__isnull=False
        ).exclude(full_name__isnull=True).exclude(full_name='').order_by('-created_at')

# ------------------- PAYMENT VIEWS -------------------
class PaymentView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        """Get payment details for a ride"""
        ride_id = request.query_params.get('ride_id')
        
        if not ride_id:
            return Response(
                {"error": "Ride ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ride = Ride.objects.get(id=ride_id)
            
            # Check if user is either the client or the driver of the ride
            if (request.user.is_client and ride.client.user != request.user) or \
               (request.user.is_driver and (not ride.driver or ride.driver.user != request.user)):
                return Response(
                    {"error": "You don't have permission to view this payment"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get payment for this ride
            try:
                payment = Payment.objects.get(ride=ride)
                serializer = PaymentSerializer(payment)
                return Response(serializer.data)
            except Payment.DoesNotExist:
                return Response(
                    {"error": "Payment not found for this ride"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Ride.DoesNotExist:
            return Response(
                {"error": "Ride not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def post(self, request):
        """Create a new payment"""
        ride_id = request.data.get('ride_id')
        
        if not ride_id:
            return Response(
                {"error": "Ride ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ride = Ride.objects.get(id=ride_id)
            
            # Check if user is the client of the ride
            if request.user.is_client and ride.client.user != request.user:
                return Response(
                    {"error": "You don't have permission to create payment for this ride"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if payment already exists
            if Payment.objects.filter(ride=ride).exists():
                return Response(
                    {"error": "Payment already exists for this ride"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create payment
            serializer = PaymentCreateSerializer(data=request.data)
            if serializer.is_valid():
                payment = serializer.save()
                response_serializer = PaymentSerializer(payment)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Ride.DoesNotExist:
            return Response(
                {"error": "Ride not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentListView(generics.ListAPIView):
    """List all payments for a user"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_client:
            try:
                client_profile = ClientProfile.objects.get(user=user)
                return Payment.objects.filter(client=client_profile).order_by('-created_at')
            except ClientProfile.DoesNotExist:
                return Payment.objects.none()
        elif user.is_driver:
            try:
                driver_profile = DriverProfile.objects.get(user=user)
                return Payment.objects.filter(driver=driver_profile).order_by('-created_at')
            except DriverProfile.DoesNotExist:
                return Payment.objects.none()
        else:
            return Payment.objects.none()