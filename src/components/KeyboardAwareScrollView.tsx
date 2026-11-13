import React, { createContext, useContext, useEffect, useRef } from 'react';
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
      keyboardVerticalOffset = 0,
      extraScrollHeight = 50,
      contentContainerStyle,
      style,
      className = '',
      contentContainerClassName = '',
      containerStyle,
      onScroll,
      ...scrollViewProps
    },
    forwardedRef
  ) => {
    const internalScrollRef = useRef<ScrollView | null>(null);
    const innerContainerRef = useRef<View | null>(null);
    const activeFieldRef = useRef<View | null>(null);
    const currentScrollY = useRef(0);

    const performScrollTo = (targetView: View | null) => {
      if (!targetView || !internalScrollRef.current) return;

      setTimeout(() => {
        if (!targetView || !internalScrollRef.current) return;

        if (innerContainerRef.current) {
          targetView.measureLayout(
            innerContainerRef.current as any,
            (_x, y) => {
              const targetY = Math.max(0, y - extraScrollHeight);
              internalScrollRef.current?.scrollTo({
                y: targetY,
                animated: true,
              });
            },
            () => {
              // Fallback using measureInWindow if measureLayout fails
              targetView.measureInWindow((_x, y, _w, h) => {
                if (isNaN(y) || isNaN(h)) return;
                const offset = y > 250 ? currentScrollY.current + (y - 100) : currentScrollY.current;
                internalScrollRef.current?.scrollTo({
                  y: Math.max(0, offset),
                  animated: true,
                });
              });
            }
          );
        } else {
          targetView.measureInWindow((_x, y) => {
            if (isNaN(y)) return;
            const targetY = Math.max(0, currentScrollY.current + (y - 100));
            internalScrollRef.current?.scrollTo({
              y: targetY,
              animated: true,
            });
          });
        }
      }, 70);
    };

    const scrollToField = (targetView: View | null) => {
      activeFieldRef.current = targetView;
      performScrollTo(targetView);
    };

    useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const showSub = Keyboard.addListener(showEvent, () => {
        if (activeFieldRef.current) {
          performScrollTo(activeFieldRef.current);
        }
      });

      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const hideSub = Keyboard.addListener(hideEvent, () => {
        activeFieldRef.current = null;
      });

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, [extraScrollHeight]);

    const setRef = (node: ScrollView | null) => {
      internalScrollRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<ScrollView | null>).current = node;
      }
    };

    return (
      <FormScrollContext.Provider value={{ scrollToField }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={[{ flex: 1 }, containerStyle]}
        >
          <ScrollView
            ref={setRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={16}
            onScroll={(e) => {
              currentScrollY.current = e.nativeEvent.contentOffset.y;
              onScroll?.(e);
            }}
            className={className}
            contentContainerClassName={contentContainerClassName}
            contentContainerStyle={[
              contentContainerStyle,
              { paddingBottom: Math.max(160, (contentContainerStyle as any)?.paddingBottom || 160) },
            ]}
            style={style}
            {...scrollViewProps}
          >
            <View ref={innerContainerRef} collapsable={false} style={{ flexGrow: 1 }}>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </FormScrollContext.Provider>
    );
  }
);

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

export default KeyboardAwareScrollView;
