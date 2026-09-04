import { View, Text } from 'react-native'
import React from 'react'
import Button from '../src/layout/Button'
const Root = () => {
  return (
    <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
      <Button text='oi' variant={{backgroundColor: 'red', padding: 10}} onPress={()=> (console.log('oe'))}/>
    </View>
  )
}

export default Root