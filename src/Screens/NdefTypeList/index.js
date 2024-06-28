import * as React from 'react';
import {ScrollView, Text} from 'react-native';
import {Appbar, List, TextInput} from 'react-native-paper';
import * as NfcIcons from '../../Components/NfcIcons';
import {Button, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GetLocation from 'react-native-get-location'
import { PermissionsAndroid } from 'react-native';
//import Geolocation from '@react-native-community/geolocation';

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



  async function requestLocation() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          'title': 'Location Permission',
          'message': 'This App needs access to your location ' +
                     'so we can know where you are.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use locations ")
        checkLocation();
      } else {
        console.log("Location permission denied")
        console.log(granted)
      }
    } catch (err) {
      console.warn(err)
    }
  }


  const checkLocation = () => {
    
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000,
      rationale: {
        title: 'Location permission',
        message: 'The app needs the permission to request your location.',
        buttonPositive: 'Ok',
      },
  })
  .then(location => {
      console.log(location);
      setLatitude(location.latitude.toFixed(7));
      setLongitude(location.longitude.toFixed(7));

  })
  .catch(error => {
      const { code, message } = error;
      //requestLocation();
      console.warn(code, message);
  })
    
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
          onPress={requestLocation}>
          Ustal Pozycję GPS
        </Button>
      </ScrollView>


      <TextInput mode="outlined" label="Szerokość geograficzna" multiline={false} value={latitude} onChangeText={setLatitude} style={{marginBottom: 10, marginHorizontal:60, marginTop:30}} autoFocus={false}/>
      <TextInput mode="outlined" label="Długość geograficzna" multiline={false} value={longitude} onChangeText={setLongitude} style={{marginBottom: 10, marginHorizontal:60, marginTop:0}} autoFocus={false}/>

        
      </ScrollView>
    </>
  );
}

export default NdefTypeListScreen;
