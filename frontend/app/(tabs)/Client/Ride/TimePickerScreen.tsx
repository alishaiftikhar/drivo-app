// File: app/(tabs)/Client/MenuOptions/TimePickerScreen.tsx
import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

const TimePickerScreen = () => {
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(true);
  const router = useRouter();

  const onChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || time;
    setShowPicker(Platform.OS === 'ios');
    setTime(currentTime);

    const formattedTime = currentTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // ✅ Correct screen path
    router.replace({
      pathname: '/(tabs)/Client/Ride/RideDetails',
      params: { selectedTime: formattedTime },
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      {showPicker && (
        <DateTimePicker
          testID="timePicker"
          value={time}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};

export default TimePickerScreen;
