# apps.py
from django.apps import AppConfig
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model

class DrivoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'drivo'
    
    def ready(self):
        User = get_user_model()
        # Only connect the create_user_profile signal
        post_save.connect(create_user_profile, sender=User)
        # Remove the save_user_profile signal as it's causing issues
        # post_save.connect(save_user_profile, sender=User)

# Define signal functions outside the class
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Import models inside the function to avoid AppRegistryNotReady
        from .models import DriverProfile, ClientProfile
        
        try:
            if instance.is_driver:
                DriverProfile.objects.create(user=instance)
            elif instance.is_client:
                ClientProfile.objects.create(user=instance)
        except Exception as e:
            print(f"Error creating user profile: {e}")

def save_user_profile(sender, instance, **kwargs):
    # Import models inside the function to avoid AppRegistryNotReady
    from .models import DriverProfile, ClientProfile
    
    try:
        if instance.is_driver:
            # Check if driver_profile exists before trying to save it
            if hasattr(instance, 'driver_profile') and instance.driver_profile:
                instance.driver_profile.save()
        elif instance.is_client:
            # Check if client_profile exists before trying to save it
            if hasattr(instance, 'client_profile') and instance.client_profile:
                instance.client_profile.save()
    except Exception as e:
        print(f"Error saving user profile: {e}")