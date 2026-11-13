import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
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
  scrollToField: (targetView: View | null, fallbackY?: number | null) => void;
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
      extraScrollHeight = 65,
      contentContainerStyle,
      style,
      className = '',
      contentContainerClassName = '',
      containerStyle,
      ...scrollViewProps
    },
    forwardedRef
  ) => {
    const internalScrollRef = useRef<ScrollView | null>(null);
    const [, setKeyboardVisible] = useState(false);

    useEffect(() => {
      const showSub = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        () => setKeyboardVisible(true)
      );
      const hideSub = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => setKeyboardVisible(false)
      );

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    const setRef = (node: ScrollView | null) => {
      internalScrollRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<ScrollView | null>).current = node;
      }
    };

    const scrollToField = (targetView: View | null, fallbackY?: number | null) => {
      if (!internalScrollRef.current) return;

      const performScroll = (y: number) => {
        const targetY = Math.max(0, y - extraScrollHeight);
        internalScrollRef.current?.scrollTo({ y: targetY, animated: true });
      };

      // Allow a brief tick for soft keyboard layout changes to settle
      setTimeout(() => {
        if (!internalScrollRef.current) return;

        if (targetView && typeof targetView.measureLayout === 'function') {
          try {
            targetView.measureLayout(
              internalScrollRef.current as any,
              (_left, top) => {
                performScroll(top);
              },
              () => {
                if (typeof fallbackY === 'number') {
                  performScroll(fallbackY);
                }
              }
            );
          } catch {
            if (typeof fallbackY === 'number') {
              performScroll(fallbackY);
            }
          }
        } else if (typeof fallbackY === 'number') {
          performScroll(fallbackY);
        }
      }, 120);
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
            className={className}
            contentContainerClassName={contentContainerClassName}
            contentContainerStyle={[
              contentContainerStyle,
              { paddingBottom: Math.max(48, (contentContainerStyle as any)?.paddingBottom || 48) },
            ]}
            style={style}
            {...scrollViewProps}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </FormScrollContext.Provider>
    );
  }
);

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

export default KeyboardAwareScrollView;
