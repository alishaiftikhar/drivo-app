import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '@/constants/Color';

const circleSize = 150;

type BackgroundDesignProps = {
  children?: React.ReactNode;
  text?: string;
  imageSource?: any;
  topOffset?: number;
  floatingTopRight?: React.ReactNode; // ✅ NEW
};

const BackgroundDesign = ({
  children,
  text,
  imageSource,
  topOffset = 100,
  floatingTopRight, // ✅ Add top-right component
}: BackgroundDesignProps) => {
  return (
    <View style={styles.container}>
      {/* ✅ Floating top-right item */}
      {floatingTopRight && <View style={styles.topRight}>{floatingTopRight}</View>}

      {/* Top center circle */}
      <View style={[styles.circleContainer, { marginTop: topOffset }]}>
        <View style={styles.circle}>
          {React.isValidElement(imageSource) ? (
            imageSource
          ) : imageSource ? (
            <Image source={imageSource} style={styles.image} />
          ) : (
            text && <Text style={styles.circleText}>{text}</Text>
          )}
        </View>
      </View>

      {/* Main content */}
      <View style={styles.childArea}>{children}</View>
    </View>
  );
};

export default BackgroundDesign;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  topRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 999,
  },
  circleContainer: {
    width: circleSize + 20,
    height: circleSize + 20,
    borderRadius: (circleSize + 20) / 2,
    borderWidth: 5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  circleText: {
    color: Colors.text,
    fontSize: 30,
    fontFamily: 'serif',
    fontWeight: '900',
  },
  childArea: {
    flex: 1,
    width: '100%',
    paddingTop: 40,
    backgroundColor: Colors.background,
  },
});
