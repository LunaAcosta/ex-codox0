import { Tabs } from 'expo-router'
import CustomTabs from './components/CustomTabs'

const _layout = () => {
  return (
    <Tabs  tabBar={(props) => <CustomTabs {...props} />} screenOptions={{headerShown:false}}>
      <Tabs.Screen name='index'/>
      <Tabs.Screen name='wallet'/>
      <Tabs.Screen name='statistics'/>
      <Tabs.Screen name='codoxia'/>
      <Tabs.Screen name='ai-tools'/>
      <Tabs.Screen name='profile'/>

    </Tabs>
  )
}

export default _layout
