import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { tokens } from '../theme/tokens';

// El campo enfocado se ubica a esta fracción del área visible (desde arriba)
// cuando el teclado está abierto y el campo quedaría en la parte baja.
const FIELD_ANCHOR_RATIO = 0.2;
// Con el teclado abierto, un campo cuyo borde inferior pase de esta fracción
// del área visible se reubica en el ancla, para dejar ver el siguiente campo.
const FIELD_COMFORT_LIMIT = 0.6;

export interface FormScrollContextType {
  scrollToField: (targetView: View | null) => void;
}

export const FormScrollContext = createContext<FormScrollContextType>({
  scrollToField: () => {},
});

export const useFormScroll = () => useContext(FormScrollContext);

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  keyboardVerticalOffset?: number;
  extraScrollHeight?: number;
  className?: string;
  contentContainerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const KeyboardAwareScrollView = React.forwardRef<
  ScrollView,
  KeyboardAwareScrollViewProps
>(
  (
    {
      children,
      keyboardVerticalOffset,
      extraScrollHeight = tokens.layout.keyboardClearance,
      contentContainerStyle,
      style,
      className = '',
      contentContainerClassName = '',
      containerStyle,
      onScroll,
      onLayout,
      ...scrollViewProps
    },
    forwardedRef,
  ) => {
    const viewportRef = useRef<View | null>(null);
    const measurementGeneration = useRef(0);
    const [viewportTop, setViewportTop] = useState(0);
    const internalScrollRef = useRef<ScrollView | null>(null);
    const innerContainerRef = useRef<View | null>(null);
    const activeFieldRef = useRef<View | null>(null);
    const currentScrollY = useRef(0);
    // Borde superior del teclado en coordenadas de pantalla (null si está oculto).
    // Con edge-to-edge en Android el KeyboardAvoidingView no siempre encoge la
    // vista, así que el área visible se limita explícitamente por el teclado.
    const keyboardTopRef = useRef<number | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const measureViewport = useCallback(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const generation = ++measurementGeneration.current;
      viewport.measureInWindow((_x, y) => {
        if (
          viewportRef.current !== viewport ||
          generation !== measurementGeneration.current ||
          !Number.isFinite(y)
        )
          return;
        setViewportTop((previous) =>
          Math.abs(previous - y) < tokens.motion.measurementTolerance ? previous : y,
        );
      });
    }, []);

    const performScrollTo = (targetView: View | null) => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      if (!targetView || !internalScrollRef.current) return;
      scrollTimer.current = setTimeout(() => {
        if (activeFieldRef.current !== targetView || !internalScrollRef.current)
          return;
        internalScrollRef.current
          .getNativeScrollRef()
          ?.measureInWindow((_sx, viewportTop, _sw, viewportHeight) => {
            targetView.measureInWindow((_x, fieldTop, _w, fieldHeight) => {
              if (
                ![viewportTop, viewportHeight, fieldTop, fieldHeight].every(
                  Number.isFinite,
                ) ||
                viewportHeight <= 0
              )
                return;
              const keyboardTop = keyboardTopRef.current;
              const visibleBottom =
                keyboardTop !== null && Number.isFinite(keyboardTop)
                  ? Math.min(viewportTop + viewportHeight, keyboardTop)
                  : viewportTop + viewportHeight;
              const keyboardOpen =
                keyboardTop !== null && Number.isFinite(keyboardTop);
              const visibleHeight = Math.max(1, visibleBottom - viewportTop);
              const minTop = viewportTop + tokens.spacing.sm;
              const comfortableBottom = keyboardOpen
                ? viewportTop + visibleHeight * FIELD_COMFORT_LIMIT
                : visibleBottom - extraScrollHeight;
              const anchor =
                fieldHeight > visibleHeight * (1 - FIELD_ANCHOR_RATIO)
                  ? minTop
                  : viewportTop + visibleHeight * FIELD_ANCHOR_RATIO;
              const delta =
                fieldTop < minTop || fieldTop + fieldHeight > comfortableBottom
                  ? fieldTop - anchor
                  : 0;
              if (delta !== 0)
                internalScrollRef.current?.scrollTo({
                  y: Math.max(0, currentScrollY.current + delta),
                  animated: true,
                });
            });
          });
      }, tokens.motion.formScrollDelay);
    };

    const scrollToField = (targetView: View | null) => {
      activeFieldRef.current = targetView;
      performScrollTo(targetView);
    };

    useEffect(() => {
      const showEvent =
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const showSub = Keyboard.addListener(showEvent, (event) => {
        keyboardTopRef.current = event.endCoordinates.screenY;
        setKeyboardHeight(event.endCoordinates.height);
        measureViewport();
        if (activeFieldRef.current) {
          performScrollTo(activeFieldRef.current);
        }
      });

      const hideEvent =
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const hideSub = Keyboard.addListener(hideEvent, () => {
        keyboardTopRef.current = null;
        setKeyboardHeight(0);
        activeFieldRef.current = null;
      });

      return () => {
        ++measurementGeneration.current;
        if (scrollTimer.current) clearTimeout(scrollTimer.current);
        showSub.remove();
        hideSub.remove();
      };
    }, [extraScrollHeight, measureViewport]);

    const setRef = (node: ScrollView | null) => {
      internalScrollRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<ScrollView | null>).current =
          node;
      }
    };

    return (
      <FormScrollContext.Provider value={{ scrollToField }}>
        <View className="flex-1 min-h-0" style={containerStyle}>
          <View
            ref={viewportRef}
            collapsable={false}
            className="flex-1 min-h-0"
            onLayout={measureViewport}
          >
            <KeyboardAvoidingView
              behavior="padding"
              keyboardVerticalOffset={keyboardVerticalOffset ?? viewportTop}
              className="flex-1 min-h-0"
            >
              <ScrollView
                ref={setRef}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                scrollEventThrottle={tokens.motion.scrollThrottle}
                onLayout={(event) => {
                  measureViewport();
                  onLayout?.(event);
                  if (activeFieldRef.current)
                    performScrollTo(activeFieldRef.current);
                }}
                onContentSizeChange={() => {
                  if (activeFieldRef.current)
                    performScrollTo(activeFieldRef.current);
                }}
                onScroll={(e) => {
                  currentScrollY.current = e.nativeEvent.contentOffset.y;
                  onScroll?.(e);
                }}
                className={className}
                contentContainerClassName={contentContainerClassName}
                contentContainerStyle={[
                  contentContainerStyle,
                  {
                    paddingBottom:
                      Math.max(
                        tokens.layout.formBottom,
                        (contentContainerStyle as any)?.paddingBottom ||
                          tokens.layout.formBottom,
                      ) + keyboardHeight,
                  },
                ]}
                style={style}
                {...scrollViewProps}
              >
                <View
                  ref={innerContainerRef}
                  collapsable={false}
                  className="grow"
                >
                  {children}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </FormScrollContext.Provider>
    );
  },
);

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

export default KeyboardAwareScrollView;
