import * as React from 'react';
import {ScrollView, Text, Alert} from 'react-native';
import {Appbar, List, TextInput} from 'react-native-paper';
import * as NfcIcons from '../../Components/NfcIcons';
import {Button, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import nfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';
import NfcProxy from '../../NfcProxy';
import GetLocation from 'react-native-get-location'
import { PermissionsAndroid } from 'react-native';
import { stringToBytes } from 'react-native-nfc-manager/ndef-lib/util';
//import Geolocation from '@react-native-community/geolocation';
//import createNdefRecord from '@react-native-nfc-manager/ndef-lib/ndef.js'

function NdefTypeListScreen(props) {
  const {navigation} = props;
  const [probeName,setProbeName] = React.useState('');
  const [latitude,setLatitude] = React.useState('');
  const [longitude,setLongitude] = React.useState('');


  function stringToBytes(string) {
    return _toUTF8Array(string);
  }
  

  function encodeNdefMessage(ndefRecords) {
    const encodeTnf = ({mb, me, cf, sr, il, tnf}) => {
      let value = tnf;
  
      if (mb) {
        value = value | 0x80;
      }
  
      if (me) {
        value = value | 0x40;
      }
  
      // note if cf: me, mb, li must be false and tnf must be 0x6
      if (cf) {
        value = value | 0x20;
      }
  
      if (sr) {
        value = value | 0x10;
      }
  
      if (il) {
        value = value | 0x8;
      }
  
      return value;
    };
  
    let encoded = [],
      tnf_byte,
      record_type,
      payload_length,
      id_length,
      i,
      mb,
      me, // messageBegin, messageEnd
      cf = false, // chunkFlag TODO implement
      sr, // boolean shortRecord
      il; // boolean idLengthFieldIsPresent
  
    for (i = 0; i < ndefRecords.length; i++) {
      mb = i === 0;
      me = i === ndefRecords.length - 1;
      sr = ndefRecords[i].payload.length < 0xff;
      il = ndefRecords[i].id.length > 0;
      tnf_byte = encodeTnf({mb, me, cf, sr, il, tnf: ndefRecords[i].tnf});
      encoded.push(tnf_byte);
  
      // type is stored as String, converting to bytes for storage
      record_type = stringToBytes(ndefRecords[i].type);
      encoded.push(record_type.length);
  
      if (sr) {
        payload_length = ndefRecords[i].payload.length;
        encoded.push(payload_length);
      } else {
        payload_length = ndefRecords[i].payload.length;
        // 4 bytes
        encoded.push(payload_length >> 24);
        encoded.push(payload_length >> 16);
        encoded.push(payload_length >> 8);
        encoded.push(payload_length & 0xff);
      }
  
      if (il) {
        id_length = ndefRecords[i].id.length;
        encoded.push(id_length);
      }
  
      encoded = encoded.concat(record_type);
  
      if (il) {
        encoded = encoded.concat(ndefRecords[i].id);
      }
  
      encoded = encoded.concat(ndefRecords[i].payload);
    }
  
    return encoded;
  }
  
// https://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
function _toUTF8Array(str) {
  var out = [],
    p = 0;
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192;
      out[p++] = (c & 63) | 128;
    } else if (
      (c & 0xfc00) === 0xd800 &&
      i + 1 < str.length &&
      (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00
    ) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
      out[p++] = (c >> 18) | 240;
      out[p++] = ((c >> 12) & 63) | 128;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    } else {
      out[p++] = (c >> 12) | 224;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    }
  }
  return out;
}

function createNdefRecord(tnf, type, id, payload) {
  if (
    tnf === undefined ||
    type === undefined ||
    id === undefined ||
    payload === undefined
  ) {
    throw new Error('missing required param');
  }

  // store type as String so it's easier to compare
  if (type instanceof Array) {
    type = bytesToString(type);
  }

  // in the future, id could be a String
  if (!(id instanceof Array)) {
    id = stringToBytes(id);
  }

  // Payload must be binary
  if (!(payload instanceof Array)) {
    payload = stringToBytes(payload);
  }

  return {
    tnf: tnf,
    type: type,
    id: id,
    payload: payload,
  };
}


  const writeNdef = async () => {

    let time=new Date();
    let month=time.getMonth()+1;
    let year=time.getFullYear();
    

    if ((year>2025) || ((year==2024) && (month>=10)))
      {
        Alert.alert('Nie możesz już zapisywać tokenów', '', [
          {text: 'Rozumiem', onPress: () => 0},
        ]);
      return;
      }
      

    
    let geourl = '';
    if (latitude !== '' && longitude!=='') {
      geourl = 'geo:'+ latitude+','+longitude;
    }
    let probe = 'Probe:' + probeName;

    let rec= createNdefRecord("1","T",1,Ndef.text.encodePayload(probe));
    let uri= createNdefRecord("1","U",2,Ndef.uri.encodePayload(geourl));
    let message=encodeNdefMessage([rec,uri]);

    await NfcProxy.writeTextAndURI({vtext:probe,vuri:geourl});
    
    
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
        
        checkLocation();
      } else {
      }
    } catch (err) {
    }
  }


  function checkLocation() {
    
    GetLocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 60000,
      rationale: {
        title: 'Location permission',
        message: 'The app needs the permission to request your location.',
        buttonPositive: 'Ok',
      },
  })
  .then(location => {
      
      setLatitude(location.latitude.toFixed(7));
      setLongitude(location.longitude.toFixed(7));

  })
  .catch(error => {
      const { code, message } = error;
  })
    
  };


  
  const requestPermission = async () => {
    try {
      
      const granted = await PermissionsAndroid.request( PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location',
        },
      );

      if (granted==="granted") {
        checkLocation();
        return true;
      } else {
        return false;
      }
    } catch (err) {
    }
  };


  return (
    <>
      <Appbar.Header style={{backgroundColor: 'white'}}>
        <Text style={{marginLeft: 10, fontSize: 24}}>Zapisz dane do tagu NFC</Text>
      </Appbar.Header>

      <ScrollView style={{flex: 1, backgroundColor: 'white'}}>
      
      <TextInput mode="outlined" label="Nazwa próbki" multiline={false} value={probeName} onChangeText={setProbeName} style={{marginBottom: 10, fontSize:22, width:220, marginTop:60, alignSelf: 'center'}} autoFocus={true}/>
      
      <ScrollView horizontal contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', marginTop:30 }}>
      
      <Button
          icon={() => (
            <Icon name="map-marker" size={22} style={{alignSelf: 'center', color: '#555'}} />
          )}
          mode="contained-tonal"
          onPress={requestPermission}>
          Ustal Pozycję GPS
        </Button>
      </ScrollView>


      <TextInput mode="outlined" label="Szerokość geograficzna" multiline={false} value={latitude} onChangeText={setLatitude} style={{marginBottom: 10, marginHorizontal:80, marginTop:30, fontSize:20}} autoFocus={false}/>
      <TextInput mode="outlined" label="Długość geograficzna" multiline={false} value={longitude} onChangeText={setLongitude} style={{marginBottom: 10, marginHorizontal:80, marginTop:0, fontSize:20}} autoFocus={false}/>


      <Button
          icon={() => (
            <Icon name="content-save" size={26} style={{alignSelf: 'center', color: '#fff'}} />
          )}
          mode="contained-tonal"
          buttonColor='#0aa'
          textColor='#fff'
          marginTop='40'
          fontSize="24"
          style={{ width: 160, marginTop:40, alignSelf:'center' , fontSize:24}}
          
          onPress={writeNdef}>
          Zapisz
        </Button>

      </ScrollView>
    </>
  );
}

export default NdefTypeListScreen;
