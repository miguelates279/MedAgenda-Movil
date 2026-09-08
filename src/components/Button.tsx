import { Pressable, Text } from "react-native";

import React from 'react'

interface ButtonProps {
    text: string;
    variant: any; 
    onPress?: () => void;
}

const Button = ({ text, variant, onPress}: ButtonProps) => {
  return (
    <Pressable onPress={()=> (console.log('oe'))} style={variant}>
        <Text>{text}</Text>
    </Pressable>
  )
}

export default Button