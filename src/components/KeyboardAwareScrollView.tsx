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
      extraScrollHeight = 50,
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
          Math.abs(previous - y) < 0.5 ? previous : y,
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
              const top = viewportTop + extraScrollHeight;
              const bottom = viewportTop + viewportHeight - extraScrollHeight;
              const delta =
                fieldHeight > bottom - top || fieldTop < top
                  ? fieldTop - top
                  : Math.max(0, fieldTop + fieldHeight - bottom);
              if (delta !== 0)
                internalScrollRef.current?.scrollTo({
                  y: Math.max(0, currentScrollY.current + delta),
                  animated: true,
                });
            });
          });
      }, 70);
    };

    const scrollToField = (targetView: View | null) => {
      activeFieldRef.current = targetView;
      performScrollTo(targetView);
    };

    useEffect(() => {
      const showEvent =
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const showSub = Keyboard.addListener(showEvent, () => {
        measureViewport();
        if (activeFieldRef.current) {
          performScrollTo(activeFieldRef.current);
        }
      });

      const hideEvent =
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const hideSub = Keyboard.addListener(hideEvent, () => {
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
        <View style={[{ flex: 1, minHeight: 0 }, containerStyle]}>
          <View
            ref={viewportRef}
            collapsable={false}
            style={{ flex: 1, minHeight: 0 }}
            onLayout={measureViewport}
          >
            <KeyboardAvoidingView
              behavior="padding"
              keyboardVerticalOffset={keyboardVerticalOffset ?? viewportTop}
              style={{ flex: 1, minHeight: 0 }}
            >
              <ScrollView
                ref={setRef}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                scrollEventThrottle={16}
                onLayout={(event) => {
                  measureViewport();
                  onLayout?.(event);
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
                    paddingBottom: Math.max(
                      160,
                      (contentContainerStyle as any)?.paddingBottom || 160,
                    ),
                  },
                ]}
                style={style}
                {...scrollViewProps}
              >
                <View
                  ref={innerContainerRef}
                  collapsable={false}
                  style={{ flexGrow: 1 }}
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
