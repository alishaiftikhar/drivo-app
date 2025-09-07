# views/admin_payment.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum  # Import Sum function
import stripe
from drivo.models import Payment, Ride, Earning, User  # Import User model

stripe.api_key = settings.STRIPE_SECRET_KEY

class AdminProcessPaymentView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id)
            
            # Check if payment is pending
            if payment.status != 'pending':
                return Response(
                    {"error": "Payment is not in pending status"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if ride is completed
            if payment.ride.status != 'completed':
                return Response(
                    {"error": "Ride is not completed yet"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Process payment with Stripe
            try:
                # Create a charge for the full amount
                charge = stripe.Charge.create(
                    amount=int(payment.amount * 100),  # Convert to cents
                    currency='usd',
                    source='tok_visa',  # In production, use actual token from client
                    description=f'Payment for ride {payment.ride.id}'
                )
                
                # Transfer driver amount (95%) to driver's Stripe account
                if payment.driver.stripe_account_id:
                    transfer = stripe.Transfer.create(
                        amount=int(payment.driver_amount * 100),  # Convert to cents
                        currency='usd',
                        destination=payment.driver.stripe_account_id,
                        transfer_group=f"ride_{payment.ride.id}",
                        description=f'Driver payment for ride {payment.ride.id}'
                    )
                    payment.driver_stripe_transfer_id = transfer.id
                
                # Update payment status
                payment.status = 'completed'
                payment.transaction_id = charge.id
                payment.processed_at = timezone.now()
                payment.save()
                
                # Create earning record for driver
                Earning.objects.create(
                    driver=payment.driver,
                    ride=payment.ride,
                    amount=payment.driver_amount,
                    commission=payment.commission_amount,
                    net_amount=payment.driver_amount,
                    payment_status='paid',
                    paid_at=timezone.now()
                )
                
                return Response({
                    "success": True,
                    "message": "Payment processed successfully",
                    "charge_id": charge.id,
                    "driver_transfer_id": payment.driver_stripe_transfer_id
                }, status=status.HTTP_200_OK)
                
            except stripe.error.StripeError as e:
                return Response(
                    {"error": f"Stripe error: {str(e)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Get basic stats
        total_users = User.objects.count()
        total_drivers = User.objects.filter(is_driver=True).count()
        total_clients = User.objects.filter(is_client=True).count()
        total_rides = Ride.objects.count()
        completed_rides = Ride.objects.filter(status='completed').count()
        
        # Payment stats
        total_payments = Payment.objects.count()
        pending_payments = Payment.objects.filter(status='pending').count()
        completed_payments = Payment.objects.filter(status='completed').count()
        total_revenue = Payment.objects.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0
        total_commission = Payment.objects.filter(status='completed').aggregate(Sum('commission_amount'))['commission__sum'] or 0
        
        # Earnings stats
        total_earnings = Earning.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        pending_earnings = Earning.objects.filter(payment_status='pending').count()
        
        return Response({
            'user_stats': {
                'total_users': total_users,
                'total_drivers': total_drivers,
                'total_clients': total_clients,
            },
            'ride_stats': {
                'total_rides': total_rides,
                'completed_rides': completed_rides,
                'completion_rate': f"{(completed_rides / total_rides * 100):.1f}%" if total_rides > 0 else "0%",
            },
            'payment_stats': {
                'total_payments': total_payments,
                'pending_payments': pending_payments,
                'completed_payments': completed_payments,
                'total_revenue': total_revenue,
                'total_commission': total_commission,
            },
            'earnings_stats': {
                'total_earnings': total_earnings,
                'pending_earnings': pending_earnings,
            }
        }, status=status.HTTP_200_OK)