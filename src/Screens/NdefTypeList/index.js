import * as React from 'react';
import {ScrollView, Text} from 'react-native';
import {Appbar, List, TextInput} from 'react-native-paper';
import * as NfcIcons from '../../Components/NfcIcons';
import {Button, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


function NdefTypeListScreen(props) {
  const {navigation} = props;
  const [probeName,setProbeName] = React.useState('');
  const [latitude,setLatitude] = React.useState('');
  const [longitude,setLongitude] = React.useState('');

  const writeNdef = async () => {

    let geourl = value;
    if (latitude !== '' && longitude!=='') {
      url = 'geo:'+ latitude+','+longitude;
    }

    await NfcProxy.writeNdef({type: 'URI', value: url});
  };



  return (
    <>
      <Appbar.Header style={{backgroundColor: 'white'}}>
        <Text style={{marginLeft: 10, fontSize: 24}}>Zapisz dane do tagu NFC</Text>
      </Appbar.Header>

      <ScrollView style={{flex: 1, backgroundColor: 'white'}}>
      
      <TextInput mode="outlined" label="Nazwa próbki" multiline={false} value={probeName}  onChangeText={setProbeName} style={{marginBottom: 10, marginHorizontal:40, marginTop:60}} autoFocus={true}/>
      
      <ScrollView horizontal contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', marginTop:30 }}>
      
      <Button
          icon={() => (
            <Icon name="map-marker" size={22} style={{alignSelf: 'center', color: '#555'}} />
          )}
          mode="outlined"
          onPress={async () => {
            setEnabled(await NfcProxy.isEnabled());
          }}>
          Ustal Pozycję GPS
        </Button>
      </ScrollView>


      <TextInput mode="outlined" label="Szerokość geograficzna" multiline={false} value={latitude} onChangeText={setLatitude} style={{marginBottom: 10, marginHorizontal:60, marginTop:30}} autoFocus={true}/>
      <TextInput mode="outlined" label="Długość geograficzna" multiline={false} value={longitude} onChangeText={setLongitude} style={{marginBottom: 10, marginHorizontal:60, marginTop:0}} autoFocus={true}/>

        
      </ScrollView>
    </>
  );
}

export default NdefTypeListScreen;
