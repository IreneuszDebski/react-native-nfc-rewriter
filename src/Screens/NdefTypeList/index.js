import * as React from 'react';
import {ScrollView, Text} from 'react-native';
import {Appbar, List, TextInput} from 'react-native-paper';
import * as NfcIcons from '../../Components/NfcIcons';

function NdefTypeListScreen(props) {
  const {navigation} = props;
  const [probeName,setProbeName] = React.useState('');
  const [latitude,setLatitude] = React.useState('');
  const [longitude,setLongitude] = React.useState('');

  return (
    <>
      <Appbar.Header style={{backgroundColor: 'white'}}>
        <Text style={{marginLeft: 10, fontSize: 24}}>Zapisz dane do tagu NFC</Text>
      </Appbar.Header>

      <ScrollView style={{flex: 1, backgroundColor: 'white'}}>
      
      <TextInput mode="outlined" label="Nazwa próbki" multiline={false} value={probeName} autoCapitalize={false} onChangeText={setProbeName} style={{marginBottom: 10, marginHorizontal:40, marginTop:30}} autoFocus={true}/>
      <Text style={{marginTop:30, alignItems: 'center', alignSelf:'center'}}>Pozycja GPS</Text>
      <TextInput mode="outlined" label="Szerokość geograficzna" multiline={false} value={latitude} autoCapitalize={false} onChangeText={setLatitude} style={{marginBottom: 10, marginHorizontal:60, marginTop:30}} autoFocus={true}/>
      <TextInput mode="outlined" label="Długość geograficzna" multiline={false} value={longitude} autoCapitalize={false} onChangeText={setLongitude} style={{marginBottom: 10, marginHorizontal:60, marginTop:0}} autoFocus={true}/>

        
      </ScrollView>
    </>
  );
}

export default NdefTypeListScreen;
