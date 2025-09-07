from django.urls import path
from .views.user_views import *
from .views.client_views import *
from .views.driver_views import *  # This imports all views from driver_views.py
app_name = 'drivo'
urlpatterns = [
    # ===== LEGACY URLS (without prefixes) =====
    # User Authentication URLs
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('set-user-type/', SetUserTypeView.as_view(), name='set-user-type'),
    path('user-type/', UserTypeView.as_view(), name='user-type'),
    path('user-profile/', UserTypeView.as_view(), name='user-profile'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('debug/', RequestDebugView.as_view(), name='request-debug'),
    path('test-media/', test_media_view, name='test-media'),
    path('media/<path:path>', serve_media_view, name='serve-media'),
    path('geocode/', GeocodeView.as_view(), name='geocode'),
    path('cache-stats/', CacheStatsView.as_view(), name='cache-stats'),
    path('system-stats/', SystemStatisticsView.as_view(), name='system-stats'),
    
    # Client URLs
    path('profile/', ClientProfileView.as_view(), name='profile'),
    path('save-location/', SaveLocationView.as_view(), name='save-location'),
    path('get-location/', GetCurrentLocationView.as_view(), name='get-location'),
    path('ride-history/', ClientRideHistoryView.as_view(), name='ride-history'),
    path('ride-request/', RideRequestView.as_view(), name='ride-request'),
    path('review-ride/<int:ride_id>/', CreateRideReviewView.as_view(), name='create-ride-review'),
    
    # Driver URLs
    path('driver-profile/', DriverProfileView.as_view(), name='driver-profile'),
    path('update-driver-location/', UpdateDriverLocationView.as_view(), name='update-driver-location-old'),
    path('ride-requests/', DriverRideRequestsView.as_view(), name='driver-ride-requests'),
    path('current-ride/', DriverCurrentRideView.as_view(), name='driver-current-ride'),
    path('ride-history/', DriverRideHistoryView.as_view(), name='driver-ride-history'),
    path('earnings/', DriverEarningsView.as_view(), name='driver-earnings'),
    path('respond-ride/<int:request_id>/', DriverRespondToRideView.as_view(), name='driver-respond-ride'),
    path('assign-ride/<int:request_id>/', AssignDriverToRideView.as_view(), name='assign-driver-to-ride'),
    
    # ===== NEW URLS (with prefixes) =====
    # User URLs
    path('user/signup/', SignupView.as_view(), name='user-signup'),
    path('user/login/', LoginView.as_view(), name='user-login'),
    path('user/token/refresh/', TokenRefreshView.as_view(), name='user-token-refresh'),
    path('user/send-otp/', SendOTPView.as_view(), name='user-send-otp'),
    path('user/verify-otp/', VerifyOTPView.as_view(), name='user-verify-otp'),
    path('user/set-user-type/', SetUserTypeView.as_view(), name='user-set-user-type'),
    path('user/user-type/', UserTypeView.as_view(), name='user-user-type'),
    path('user/user-profile/', UserTypeView.as_view(), name='user-user-profile'),
    path('user/reset-password/', ResetPasswordView.as_view(), name='user-reset-password'),
    path('user/debug/', RequestDebugView.as_view(), name='user-request-debug'),
    path('user/test-media/', test_media_view, name='user-test-media'),
    path('user/media/<path:path>', serve_media_view, name='user-serve-media'),
    path('user/geocode/', GeocodeView.as_view(), name='user-geocode'),
    path('user/cache-stats/', CacheStatsView.as_view(), name='user-cache-stats'),
    path('user/system-stats/', SystemStatisticsView.as_view(), name='user-system-stats'),
    
    # Client URLs
    path('client/profile/', ClientProfileView.as_view(), name='client-profile'),
    path('client/update-location/', UpdateClientLocationView.as_view(), name='client-update-location'),
    path('client/save-location/', SaveLocationView.as_view(), name='client-save-location'),
    path('client/get-location/', GetCurrentLocationView.as_view(), name='client-get-location'),
    path('client/ride-history/', ClientRideHistoryView.as_view(), name='client-ride-history'),
    path('client/ride-request/', RideRequestView.as_view(), name='client-ride-request'),
    path('client/review-ride/<int:ride_id>/', CreateRideReviewView.as_view(), name='client-create-ride-review'),
    
    # Driver URLs
    path('driver/profile/', DriverProfileView.as_view(), name='driver-profile'),
    path('driver/driver-profile/', DriverProfileView.as_view(), name='driver-profile-hyphen'),
    path('driver/update-location/', UpdateDriverLocationView.as_view(), name='driver-update-location'),
    path('driver/ride-requests/', DriverRideRequestsView.as_view(), name='driver-ride-requests'),
    path('driver/current-ride/', DriverCurrentRideView.as_view(), name='driver-current-ride'),
    path('driver/ride-history/', DriverRideHistoryView.as_view(), name='driver-ride-history'),
    path('driver/earnings/', DriverEarningsView.as_view(), name='driver-earnings'),
    path('driver/respond-ride/<int:request_id>/', DriverRespondToRideView.as_view(), name='driver-respond-ride'),
    path('driver/assign-ride/<int:request_id>/', AssignDriverToRideView.as_view(), name='driver-assign-ride'),
    path('driver/update-driver-location/', UpdateDriverLocationView.as_view(), name='driver-update-driver-location-old'),
    
    # New endpoints for available drivers
    path('available-drivers/', AvailableDriversView.as_view(), name='available-drivers'),
    path('driver/available-drivers/', AvailableDriversView.as_view(), name='driver-available-drivers'),
    
    # New endpoint for all driver profiles
    path('driver/profiles/', DriverProfilesView.as_view(), name='driver-profiles'),
    
    # New endpoint for individual driver profile details
    path('driver/profiles/<int:pk>/', DriverProfileDetailView.as_view(), name='driver-profile-detail'),
    
    # New endpoint for ride details
    path('rides/<int:pk>/', RideDetailView.as_view(), name='ride-detail'),
    
    # New endpoints for ride request management
    path('client/ride-request/<int:pk>/', UpdateRideRequestView.as_view(), name='client-update-ride-request'),
    path('client/ride-request/<int:pk>/convert/', ConvertRideRequestToRideView.as_view(), name='client-convert-ride-request'),
    
    # Endpoint to fix driver data
    path('driver/fix-data/', FixDriverDataView.as_view(), name='driver-fix-data'),
    # urls.py - Add to your urlpatterns
path('admin/process-payment/<int:payment_id>/', AdminProcessPaymentView.as_view(), name='admin-process-payment'),
# urls.py
path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
# urls.py
path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),
]