import { Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 6;

// Image de React Native y no de expo-image: esta es la que anima el transform
// de forma fiable, y aquí solo hay una foto en pantalla, así que no hace falta
// el reciclado de miniaturas que aporta expo-image en la cuadrícula.
const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ZoomableImageProps {
  uri: string;
  onTap?: () => void;
  /** Mientras hay zoom, el carrusel deja de pasar de foto: si no, se queda con
   * el gesto y mover la foto ampliada cambia de imagen. */
  onZoomChange?: (zoomed: boolean) => void;
}

export function ZoomableImage({ uri, onTap, onZoomChange }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const zoomed = useSharedValue(false);

  const notifyZoom = (value: boolean) => {
    'worklet';
    if (zoomed.value === value) return;
    zoomed.value = value;
    if (onZoomChange) runOnJS(onZoomChange)(value);
  };

  const reset = () => {
    'worklet';
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    notifyZoom(false);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(next, MIN_SCALE), MAX_SCALE);
      notifyZoom(scale.value > MIN_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) reset();
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (savedScale.value <= MIN_SCALE) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > MIN_SCALE) {
        reset();
        return;
      }
      scale.value = withTiming(2.5);
      savedScale.value = 2.5;
      notifyZoom(true);
    });

  // runOnJS porque onTap es una función de React: los gestos corren en el hilo
  // de animaciones y llamarla desde ahí revienta ("Tried to synchronously call
  // a Remote Function"). Los demás solo tocan shared values y se quedan ahí,
  // que es donde van fluidos.
  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .runOnJS(true)
    .onEnd(() => {
      if (onTap) onTap();
    });

  const composedGesture = Gesture.Exclusive(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
    singleTapGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        <AnimatedImage
          source={{ uri }}
          resizeMode="contain"
          style={[styles.image, animatedStyle]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
  },
});
