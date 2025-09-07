from rest_framework import viewsets, status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.views.static import serve
from django.db import IntegrityError 
from rest_framework import serializers 
from rest_framework.exceptions import ValidationError
import random
import requests
from django.core.cache import cache
import re
from datetime import datetime, timedelta, date
from django.utils import timezone
import os
from ..models import (
    User, DriverProfile, ClientProfile, Ride, Payment, Review, EmailOTP, RideRequest
)
from ..serializers import (
    UserSerializer, DriverProfileSerializer, ClientProfileSerializer,
    RideSerializer, PaymentSerializer, ReviewSerializer, RideRequestSerializer,
    RideStatusUpdateSerializer, DriverEarningsSummarySerializer,
    NotificationPreferenceSerializer, PushNotificationTokenSerializer,
    AdminDashboardStatsSerializer, AdminDriverApprovalSerializer,
    SystemHealthSerializer
)

# ------------------- USER AUTHENTICATION VIEWS -------------------
class SignupView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def post(self, request):
        # Debug: Print incoming request data
        print("Request data:", request.data)
        
        data = request.data
        email = data.get('email')
        password = data.get('password')
        
        # More detailed validation
        if not email:
            return Response(
                {"message": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not password:
            return Response(
                {"message": "Password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate email format
        if '@' not in email:
            return Response(
                {"message": "Invalid email format."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password length
        if len(password) < 8:
            return Response(
                {"message": "Password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use the custom manager to create the user
            user = User.objects.create_user(
                email=email,
                password=password,
                is_driver=data.get('is_driver', False),
                is_client=data.get('is_client', False)
            )
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
            }, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {"message": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print("Signup error:", str(e))  # Debug: Print any errors
            return Response(
                {"message": "Signup failed", "error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# ------------------- OTP VIEWS -------------------
class SendOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'success': False, 'message': 'Email is required'}, status=400)
        
        # Delete any existing OTPs for this email
        EmailOTP.objects.filter(email=email).delete()
        
        otp = str(random.randint(100000, 999999))
        # Set expiration to 5 minutes from now in UTC
        expires_at = timezone.now() + timedelta(minutes=5)
        
        # Create OTP with explicit expiration
        EmailOTP.objects.create(
            email=email,
            otp=otp,
            expires_at=expires_at
        )
        
        try:
            send_mail(
                subject='Your OTP Code',
                message=f'Your OTP code is {otp}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({'success': True, 'message': 'OTP sent successfully'})
        except Exception as e:
            return Response({'success': False, 'message': f'Failed to send OTP: {str(e)}'}, status=500)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({
                'success': False, 
                'message': 'Email and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get the most recent OTP for this email
            otp_obj = EmailOTP.objects.filter(email=email).latest('created_at')
            
            # Enhanced debugging with proper time comparison
            now = timezone.now()
            print(f"Current time: {now}")
            print(f"OTP created: {otp_obj.created_at}")
            print(f"OTP expires: {otp_obj.expires_at}")
            print(f"Is expired: {otp_obj.expires_at < now}")
            
            # Use direct comparison instead of is_expired() method
            if otp_obj.expires_at < now:
                return Response({
                    'success': False, 
                    'message': 'OTP has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_obj.is_used:
                return Response({
                    'success': False, 
                    'message': 'OTP has already been used. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_obj.otp != otp:
                return Response({
                    'success': False, 
                    'message': 'Invalid OTP. Please check and try again.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    'success': False, 
                    'message': 'User not found. Please sign up first.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if not user.is_active:
                user.is_active = True
                user.save()
            
            # Mark OTP as used
            otp_obj.is_used = True
            otp_obj.save()
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'OTP verified successfully',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
                'email': user.email,
                'is_driver': user.is_driver,
                'is_client': user.is_client
            }, status=status.HTTP_200_OK)
            
        except EmailOTP.DoesNotExist:
            return Response({
                'success': False, 
                'message': 'No OTP found for this email. Please request a new one.'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # More detailed error logging
            print(f"OTP Verification Error: {str(e)}")
            print(f"Error type: {type(e)}")
            return Response({
                'success': False, 
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ------------------- SET USER TYPE VIEW -------------------
class SetUserTypeView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request):
        user_type = request.data.get('user_type') or request.data.get('type')
        user = request.user
        
        if user_type == 'driver':
            user.is_driver = True
            user.is_client = False
            user.save()
            
            driver_profile, created = DriverProfile.objects.get_or_create(user=user, defaults={
                'full_name': '',
                'age': None,
                'cnic': '',
                'driving_license': '',
                'license_expiry': None,
                'phone_number': '',
                'city': '',
                'status': 'available'
            })
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "success": True, 
                "message": "Switched to driver mode",
                "is_driver": True,
                "is_client": False,
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "profile_id": driver_profile.id
            }, status=200)
            
        elif user_type == 'client':
            user.is_client = True
            user.is_driver = False
            user.save()
            
            client_profile, created = ClientProfile.objects.get_or_create(user=user, defaults={
                'full_name': '',
                'age': None,
                'cnic': '',
                'phone_number': '',
                'address': ''
            })
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "success": True, 
                "message": "Switched to client mode",
                "is_client": True,
                "is_driver": False,
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "profile_id": client_profile.id
            }, status=200)
        else:
            return Response(
                {"error": "Invalid user type"}, 
                status=400
            )

# ------------------- USER TYPE VIEW -------------------
class UserTypeView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        return Response({
            'is_client': request.user.is_client,
            'is_driver': request.user.is_driver,
            'email': request.user.email,
            'user_id': request.user.id
        }, status=200)

# ------------------- RESET PASSWORD VIEW -------------------
class ResetPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request):
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not new_password or not confirm_password:
            return Response(
                {"success": False, "message": "Both new_password and confirm_password are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {"success": False, "message": "Passwords do not match"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        user.set_password(new_password)
        user.save()
        
        return Response(
            {"success": True, "message": "Password updated successfully"}, 
            status=status.HTTP_200_OK
        )

# ------------------- DEBUG VIEWS -------------------
class RequestDebugView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def post(self, request):
        print("=== FULL REQUEST DEBUG ===")
        print("Headers:", dict(request.headers))
        print("Auth header:", request.headers.get('Authorization'))
        print("User:", request.user)
        print("Authenticated:", request.user.is_authenticated)
        print("Is client:", request.user.is_client)
        print("Is driver:", request.user.is_driver)
        
        return Response({
            'headers': dict(request.headers),
            'auth_header': request.headers.get('Authorization'),
            'user': {
                'username': str(request.user),
                'authenticated': request.user.is_authenticated,
                'is_client': request.user.is_client,
                'is_driver': request.user.is_driver,
            }
        }, status=200)

def test_media_view(request):
    media_root = settings.MEDIA_ROOT
    media_url = settings.MEDIA_URL
    
    media_exists = os.path.exists(media_root)
    
    profile_pics_path = os.path.join(media_root, 'profile_pics')
    profile_pics_exists = os.path.exists(profile_pics_path)
    
    profile_pics_files = []
    if profile_pics_exists:
        profile_pics_files = os.listdir(profile_pics_path)
    
    response_content = f"""
    <h1>Media Debug Information</h1>
    <p>MEDIA_ROOT: {media_root}</p>
    <p>MEDIA_URL: {media_url}</p>
    <p>Media directory exists: {media_exists}</p>
    <p>Profile pics directory exists: {profile_pics_exists}</p>
    <p>Files in profile_pics: {profile_pics_files}</p>
    """
    
    return Response(response_content)

def serve_media_view(request, path):
    return serve(request, path, document_root=settings.MEDIA_ROOT)

# ------------------- GEOCODE VIEW -------------------
def sanitize_cache_key(query):
    return re.sub(r'[^A-Za-z0-9]', '_', query.strip().lower())

class GeocodeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response(
                {"error": "Query parameter 'q' is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        normalized_query = ' '.join(query.split())
        cache_key = f'geocode_{sanitize_cache_key(normalized_query)}'
        
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            print(f"Cache hit for: {query}")
            return Response(cached_response, status=status.HTTP_200_OK)
        
        print(f"Cache miss for: {query} - Making API request")
        
        default_coordinates = {
            'lahore': {'lat': '31.5204', 'lon': '74.3587', 'display_name': 'Lahore, Pakistan'},
            'karachi': {'lat': '24.8607', 'lon': '67.0011', 'display_name': 'Karachi, Pakistan'},
            'islamabad': {'lat': '33.6844', 'lon': '73.0479', 'display_name': 'Islamabad, Pakistan'},
            'rawalpindi': {'lat': '33.6007', 'lon': '73.0679', 'display_name': 'Rawalpindi, Pakistan'},
            'peshawar': {'lat': '34.0151', 'lon': '71.5249', 'display_name': 'Peshawar, Pakistan'},
            'quetta': {'lat': '30.1798', 'lon': '66.9750', 'display_name': 'Quetta, Pakistan'},
            'multan': {'lat': '30.1575', 'lon': '71.5249', 'display_name': 'Multan, Pakistan'},
            'faisalabad': {'lat': '31.4187', 'lon': '73.0791', 'display_name': 'Faisalabad, Pakistan'},
        }
        
        url = 'https://nominatim.openstreetmap.org/search'
        params = {
            'q': normalized_query,
            'format': 'json',
            'limit': 1,
            'addressdetails': 1,
            'extratags': 1,
            'namedetails': 1
        }
        headers = {
            'User-Agent': 'Drivo/1.0 (gdooduii@gmail.com)'
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if data:
                cache.set(cache_key, data, timeout=86400)
                print(f"Cached response for: {query}")
                return Response(data, status=status.HTTP_200_OK)
            else:
                query_lower = normalized_query.lower()
                for city, coords in default_coordinates.items():
                    if city in query_lower:
                        print(f"Using default coordinates for {city}")
                        default_data = [coords]
                        cache.set(cache_key, default_data, timeout=86400)
                        return Response(default_data, status=status.HTTP_200_OK)
                
                cache.set(cache_key, [], timeout=3600)
                return Response(
                    {"error": "Location not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except requests.RequestException as e:
            query_lower = normalized_query.lower()
            for city, coords in default_coordinates.items():
                if city in query_lower:
                    print(f"API failed, using default coordinates for {city}")
                    default_data = [coords]
                    cache.set(cache_key, default_data, timeout=86400)
                    return Response(default_data, status=status.HTTP_200_OK)
            
            cache.set(cache_key, {'error': str(e)}, timeout=300)
            return Response(
                {"error": "External API request failed", "details": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

# ------------------- CACHE STATS VIEW -------------------
class CacheStatsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def get(self, request):
        from django.core.cache import cache
        
        try:
            if hasattr(cache, '_cache'):
                geocode_keys = len([k for k in cache._cache.keys() if k.startswith('geocode')])
                total_keys = len(cache._cache.keys())
            else:
                geocode_keys = "N/A"
                total_keys = "N/A"
                
            stats = {
                'backend': str(cache._class_),
                'geocode_cache_entries': geocode_keys,
                'total_cache_entries': total_keys,
                'cache_config': {
                    'timeout_default': settings.CACHES.get('default', {}).get('TIMEOUT', 'N/A'),
                    'backend': settings.CACHES.get('default', {}).get('BACKEND', 'N/A')
                }
            }
        except Exception as e:
            stats = {
                'error': str(e),
                'backend': str(cache._class_)
            }
        
        return Response(stats, status=200)

# ------------------- SYSTEM STATISTICS VIEW -------------------
class SystemStatisticsView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def get(self, request, *args, **kwargs):
        db_status = "OK"
        try:
            User.objects.count()
        except Exception as e:
            db_status = f"Error: {str(e)}"
        
        from django.conf import settings
        
        return Response({
            "status": "OK",
            "database": db_status,
            "version": getattr(settings, 'VERSION', '1.0.0'),
            "environment": "Development" if settings.DEBUG else "Production",
        })

# ------------------- LOGIN VIEW -------------------
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {"message": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user_id': user.id,
                    'email': user.email,
                    'is_driver': user.is_driver,
                    'is_client': user.is_client
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"message": "Invalid credentials."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except User.DoesNotExist:
            return Response(
                {"message": "User not found."},
                status=status.HTTP_401_UNAUTHORIZED
            )

# ------------------- TOKEN REFRESH VIEW -------------------
class TokenRefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication for this view
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token
            return Response({
                'access': str(access)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )